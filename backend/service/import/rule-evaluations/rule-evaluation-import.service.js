const Alternative = require("../../../models/alternative.model")
const RuleEvaluation = require("../../../models/rule-evaluation.model")
const { db } = require("../../../config/database")

const parser = require("../workbook-parser.service")
const validator = require("./rule-evaluation-validator")
const template = require("./rule-evaluation-template")
const { ValidationError } = require("../../../utils/appError")
const { IMPORT_MODES } = require("../../../models/import-history.model")

const KIND = "rule_evaluations"

const buildAlternativeLookup = async (decisionModelId) => {
   const alternatives = await Alternative.findAll({
      where: { decision_model_id: decisionModelId },
      attributes: ["id", "name"]
   })

   const map = new Map()
   for (const alternative of alternatives) {
      map.set(validator.normalizeKey(alternative.name), { id: alternative.id, name: alternative.name })
   }
   return map
}

const buildExistingEvaluationLookup = async (alternativeIds, variableIds) => {
   if (!alternativeIds.length || !variableIds.length) return new Map()

   const evaluations = await RuleEvaluation.findAll({
      where: {
         alternative_id: alternativeIds,
         rule_variable_id: variableIds
      }
   })

   const map = new Map()
   for (const evaluation of evaluations) {
      const key = `${evaluation.alternative_id}:${evaluation.rule_variable_id}`
      map.set(key, evaluation)
   }
   return map
}

const isMetaHeader = (label) => typeof label === "string" && label.startsWith("_")

const buildHeaderMappings = (headers, variables) => {
   return headers
      .filter((header) => !isMetaHeader(header.label))
      .map((header) => {
         if (header.label === validator.ALTERNATIVE_HEADER) {
            return { header: validator.ALTERNATIVE_HEADER, variable: null }
         }
         const variable = validator.matchVariableForHeader(header.label, variables)
         return { header: header.label, variable }
      })
}

const buildPreview = async ({ buffer, decisionModelId, mode }) => {
   const parsed = await parser.parseSheet({
      buffer,
      sheetName: template.SHEET_NAME,
      requiredHeaders: [validator.ALTERNATIVE_HEADER],
      decisionModelId,
      templateType: template.TEMPLATE_TYPE
   })

   const variables = await template.loadActiveVariables(decisionModelId)

   if (!variables.length) {
      throw new ValidationError("Decision model has no active rule variables. Please configure rule variables before importing rule evaluations.")
   }

   const headerMappings = buildHeaderMappings(parsed.headers, variables)

   const alternativeMap = await buildAlternativeLookup(decisionModelId)
   const validatedRows = parsed.rows.map((row) => validator.validateRow({ row, alternativeMap, headerMappings }))

   const alternativeIds = Array.from(new Set(validatedRows.map((row) => row.alternative_id).filter(Boolean)))
   const variableIds = variables.map((variable) => variable.id)
   const existingMap = await buildExistingEvaluationLookup(alternativeIds, variableIds)

   const decoratedRows = validatedRows.map((row) => {
      let toCreateCount = 0
      let toUpdateCount = 0
      let skipCount = 0
      const cellsWithAction = []
      const cellErrors = []

      for (const cell of row.cells) {
         if (cell.errors.length) {
            cellErrors.push(...cell.errors.map((error) => ({ field: cell.header, message: error.message })))
         }

         if (cell.action !== "set" || !row.alternative_id) {
            skipCount += 1
            cellsWithAction.push({ ...cell, final_action: "skip" })
            continue
         }

         const key = `${row.alternative_id}:${cell.variable_id}`
         const existing = existingMap.get(key)

         if (!existing) {
            toCreateCount += 1
            cellsWithAction.push({ ...cell, final_action: "create" })
            continue
         }

         if (mode === IMPORT_MODES.UPSERT) {
            if (validator.valuesEqual({ existing, payload: cell.payload })) {
               skipCount += 1
               cellsWithAction.push({ ...cell, final_action: "skip", reason: "unchanged" })
            } else {
               toUpdateCount += 1
               cellsWithAction.push({ ...cell, final_action: "update", existing_id: existing.id })
            }
         } else {
            skipCount += 1
            cellsWithAction.push({ ...cell, final_action: "skip", reason: "existing_create_only" })
         }
      }

      const aggregateErrors = [...row.errors, ...cellErrors]
      const status = aggregateErrors.length
         ? "invalid"
         : (toUpdateCount > 0 ? "conflict" : (toCreateCount > 0 ? "valid" : "noop"))

      return {
         row_number: row.row_number,
         status,
         action: aggregateErrors.length ? "skip" : (toCreateCount + toUpdateCount > 0 ? "set" : "skip"),
         data: {
            alternative_name: row.alternative_name,
            alternative_id: row.alternative_id,
            cells: cellsWithAction
         },
         summary: {
            to_create: toCreateCount,
            to_update: toUpdateCount,
            to_skip: skipCount
         },
         errors: aggregateErrors,
         warnings: []
      }
   })

   const summary = decoratedRows.reduce((acc, row) => {
      acc.total_rows += 1
      acc.to_create += row.summary.to_create
      acc.to_update += row.summary.to_update
      acc.to_skip += row.summary.to_skip
      if (row.status === "valid") acc.valid_count += 1
      if (row.status === "invalid") acc.invalid_count += 1
      if (row.status === "conflict") acc.conflict_with_database += 1
      return acc
   }, {
      total_rows: 0,
      valid_count: 0,
      invalid_count: 0,
      duplicate_in_file: 0,
      conflict_with_database: 0,
      to_create: 0,
      to_update: 0,
      to_skip: 0
   })

   return {
      kind: KIND,
      mode,
      headers: parsed.headers.map((header) => header.label),
      rows: decoratedRows,
      summary,
      template_metadata: parsed.metadata,
      warnings: []
   }
}

const commitPreview = async ({ preview, skipInvalid }) => {
   if (!skipInvalid) {
      const hasInvalid = preview.rows.some((row) => row.status === "invalid")
      if (hasInvalid) {
         throw new ValidationError("Preview contains invalid rows. Enable 'skip_invalid' or fix the file.")
      }
   }

   const startedAt = Date.now()

   const result = await db.transaction(async (transaction) => {
      let created = 0
      let updated = 0
      let skipped = 0

      for (const row of preview.rows) {
         if (row.status === "invalid" || !row.data.alternative_id) {
            skipped += row.data.cells.length
            continue
         }

         for (const cell of row.data.cells) {
            if (cell.final_action === "create") {
               await RuleEvaluation.create({
                  ...cell.payload,
                  created_at: new Date()
               }, { transaction })
               created += 1
            } else if (cell.final_action === "update") {
               await RuleEvaluation.update(
                  cell.payload,
                  { where: { id: cell.existing_id }, transaction }
               )
               updated += 1
            } else {
               skipped += 1
            }
         }
      }

      return { created, updated, skipped }
   })

   const durationMs = Date.now() - startedAt

   return {
      ...result,
      duration_ms: durationMs
   }
}

module.exports = {
   buildPreview,
   commitPreview,
   buildHeaderMappings,
   buildAlternativeLookup,
   buildExistingEvaluationLookup,
   KIND
}
