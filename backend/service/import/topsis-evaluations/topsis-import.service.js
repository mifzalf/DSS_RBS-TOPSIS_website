const Alternative = require("../../../models/alternative.model")
const Evaluation = require("../../../models/evaluation.model")
const { db } = require("../../../config/database")

const parser = require("../workbook-parser.service")
const validator = require("./topsis-validator")
const template = require("./topsis-template")
const { ValidationError } = require("../../../utils/appError")
const { IMPORT_MODES } = require("../../../models/import-history.model")

const KIND = "topsis_evaluations"

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

const buildExistingEvaluationLookup = async (alternativeIds, criteriaIds) => {
   if (!alternativeIds.length || !criteriaIds.length) return new Map()

   const evaluations = await Evaluation.findAll({
      where: {
         alternative_id: alternativeIds,
         criteria_id: criteriaIds
      }
   })

   const map = new Map()
   for (const evaluation of evaluations) {
      const key = `${evaluation.alternative_id}:${evaluation.criteria_id}`
      map.set(key, evaluation)
   }
   return map
}

const isMetaHeader = (label) => typeof label === "string" && label.startsWith("_")

const buildHeaderMappings = (headers, criteriaList) => {
   return headers
      .filter((header) => !isMetaHeader(header.label))
      .map((header) => {
         if (header.label === validator.ALTERNATIVE_HEADER) {
            return { header: validator.ALTERNATIVE_HEADER, criteria: null }
         }
         const criteria = validator.matchCriteriaForHeader(header.label, criteriaList)
         return { header: header.label, criteria }
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

   const criteriaList = await template.loadReferenceData(decisionModelId)

   if (!criteriaList.length) {
      throw new ValidationError("Decision model has no active criteria. Please configure criteria before importing evaluations.")
   }

   const headerMappings = buildHeaderMappings(parsed.headers, criteriaList)
   const unknownHeaders = headerMappings.filter((mapping) => mapping.header !== validator.ALTERNATIVE_HEADER && !mapping.criteria)

   const alternativeMap = await buildAlternativeLookup(decisionModelId)

   const validatedRows = parsed.rows.map((row) => validator.validateRow({ row, alternativeMap, headerMappings }))

   const alternativeIds = Array.from(new Set(validatedRows.map((row) => row.alternative_id).filter(Boolean)))
   const criteriaIds = criteriaList.map((item) => item.id)
   const existingEvaluations = await buildExistingEvaluationLookup(alternativeIds, criteriaIds)

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

         const key = `${row.alternative_id}:${cell.criteria_id}`
         const existing = existingEvaluations.get(key)

         if (!existing) {
            toCreateCount += 1
            cellsWithAction.push({ ...cell, final_action: "create" })
            continue
         }

         if (mode === IMPORT_MODES.UPSERT) {
            if (existing.sub_criteria_id === cell.sub_criteria_id) {
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
      warnings: unknownHeaders.length ? unknownHeaders.map((mapping) => ({
         field: mapping.header,
         message: `Header "${mapping.header}" tidak cocok dengan kriteria aktif manapun dan akan diabaikan`
      })) : []
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
               await Evaluation.create({
                  alternative_id: row.data.alternative_id,
                  criteria_id: cell.criteria_id,
                  sub_criteria_id: cell.sub_criteria_id
               }, { transaction })
               created += 1
            } else if (cell.final_action === "update") {
               await Evaluation.update(
                  { sub_criteria_id: cell.sub_criteria_id },
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
