const Alternative = require("../../../models/alternative.model")
const { db } = require("../../../config/database")

const parser = require("../workbook-parser.service")
const validator = require("./alternative-validator")
const template = require("./alternative-template")
const { ValidationError } = require("../../../utils/appError")
const { IMPORT_MODES } = require("../../../models/import-history.model")

const KIND = "alternatives"
const REQUIRED_HEADERS = ["name", "description"]
const SHEET_NAME = "Alternatives"

const resolveExistingAlternatives = async (decisionModelId) => {
   const existing = await Alternative.findAll({
      where: { decision_model_id: decisionModelId },
      attributes: ["id", "name", "description"]
   })

   const map = new Map()

   for (const item of existing) {
      map.set(validator.normalizeNameKey(item.name), {
         id: item.id,
         name: item.name,
         description: item.description
      })
   }

   return map
}

const determineActionForRow = ({ row, mode, existingMap }) => {
   if (row.errors.length) {
      return { status: "invalid", action: "skip", warnings: [], existing: null }
   }

   const key = validator.normalizeNameKey(row.data.name)
   const existing = existingMap.get(key)

   if (!existing) {
      return { status: "valid", action: "create", warnings: [], existing: null }
   }

   if (mode === IMPORT_MODES.UPSERT) {
      return {
         status: "conflict",
         action: "update",
         warnings: [{ field: "name", message: "Name already exists, will be updated" }],
         existing
      }
   }

   return {
      status: "conflict",
      action: "skip",
      warnings: [{ field: "name", message: "Name already exists. Mode 'create_only' rejects duplicates." }],
      existing
   }
}

const buildPreview = async ({ buffer, decisionModelId, mode }) => {
   const parsed = await parser.parseSheet({
      buffer,
      sheetName: SHEET_NAME,
      requiredHeaders: REQUIRED_HEADERS,
      decisionModelId,
      templateType: template.TEMPLATE_TYPE
   })

   const validated = parsed.rows.map((row) => validator.validateRow(row))
   validator.detectInFileDuplicates(validated)

   const existingMap = await resolveExistingAlternatives(decisionModelId)

   const decoratedRows = validated.map((row) => {
      const decision = determineActionForRow({ row, mode, existingMap })

      const decoratedErrors = decision.action === "skip" && row.errors.length === 0 && decision.status === "conflict"
         ? [...row.errors, ...decision.warnings.map((warning) => ({ field: warning.field, message: warning.message }))]
         : row.errors

      return {
         row_number: row.row_number,
         status: decision.status,
         action: decision.action,
         data: row.data,
         existing_id: decision.existing?.id || null,
         errors: decoratedErrors,
         warnings: decision.warnings
      }
   })

   const summary = decoratedRows.reduce((acc, row) => {
      acc.total_rows += 1
      if (row.action === "create") acc.to_create += 1
      if (row.action === "update") acc.to_update += 1
      if (row.action === "skip") acc.to_skip += 1
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

   summary.duplicate_in_file = decoratedRows.filter((row) => row.errors.some((error) => error.message === "Duplicate name within the file")).length

   return {
      kind: KIND,
      mode,
      headers: parsed.headers.map((header) => header.label),
      rows: decoratedRows,
      summary,
      template_metadata: parsed.metadata
   }
}

const commitPreview = async ({ preview, decisionModelId, skipInvalid }) => {
   const rowsToProcess = preview.rows.filter((row) => {
      if (row.action === "create" || row.action === "update") return true
      return false
   })

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
      let skipped = preview.rows.length - rowsToProcess.length

      const toCreate = rowsToProcess.filter((row) => row.action === "create")
      const toUpdate = rowsToProcess.filter((row) => row.action === "update")

      if (toCreate.length) {
         await Alternative.bulkCreate(
            toCreate.map((row) => ({
               decision_model_id: decisionModelId,
               name: row.data.name,
               description: row.data.description,
               created_at: new Date()
            })),
            { transaction }
         )
         created += toCreate.length
      }

      for (const row of toUpdate) {
         await Alternative.update(
            { description: row.data.description },
            {
               where: { id: row.existing_id },
               transaction
            }
         )
         updated += 1
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
   resolveExistingAlternatives,
   KIND,
   REQUIRED_HEADERS,
   SHEET_NAME
}
