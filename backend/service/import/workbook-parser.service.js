const ExcelJS = require("exceljs")

const { ValidationError } = require("../../utils/appError")

const TEMPLATE_META_PREFIX = "_meta."
const META_SHEET_NAME = "_meta"
const META_TEMPLATE_VERSION_CELL = "B1"
const META_DECISION_MODEL_CELL = "B2"
const META_TEMPLATE_TYPE_CELL = "B3"
const META_GENERATED_AT_CELL = "B4"

const getMaxRows = () => {
   const configured = Number(process.env.IMPORT_MAX_ROWS)
   if (Number.isFinite(configured) && configured > 0) return configured
   return 1000
}

const getMaxCellLength = () => 5000

const readCellValue = (cell) => {
   if (!cell) return null

   const value = cell.value

   if (value === null || value === undefined) return null

   if (typeof value === "object") {
      if (value.text !== undefined) return value.text
      if (value.result !== undefined) return value.result
      if (value.richText) return value.richText.map((part) => part.text || "").join("")
      if (value.formula !== undefined) return value.result ?? null
      if (value.hyperlink !== undefined) return value.text || value.hyperlink
      if (value instanceof Date) return value
      if (Array.isArray(value)) return value.join("")
   }

   return value
}

const normalizeText = (value) => {
   if (value === null || value === undefined) return ""
   if (typeof value === "string") return value.trim()
   if (typeof value === "number" || typeof value === "boolean") return String(value).trim()
   if (value instanceof Date) return value.toISOString()
   return String(value).trim()
}

const loadWorkbookFromBuffer = async (buffer) => {
   if (!Buffer.isBuffer(buffer)) {
      throw new ValidationError("Workbook buffer is required")
   }

   const workbook = new ExcelJS.Workbook()

   try {
      await workbook.xlsx.load(buffer, {
         ignoreNodes: ["dataValidations"]
      })
   } catch (error) {
      throw new ValidationError("Unable to read workbook. Make sure the file is a valid .xlsx file.")
   }

   return workbook
}

const getWorksheetByName = (workbook, sheetName) => {
   const sheet = workbook.getWorksheet(sheetName)

   if (!sheet) {
      throw new ValidationError(`Sheet "${sheetName}" not found in workbook`)
   }

   return sheet
}

const readHeaderRow = (sheet) => {
   const headerRow = sheet.getRow(1)

   if (!headerRow || headerRow.cellCount === 0) {
      throw new ValidationError("Sheet is missing the header row")
   }

   const headers = []

   headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const value = normalizeText(readCellValue(cell))

      if (!value) return

      headers.push({
         column: colNumber,
         label: value,
         normalized: value.toLowerCase()
      })
   })

   if (!headers.length) {
      throw new ValidationError("Header row must not be empty")
   }

   return headers
}

const ensureRequiredHeaders = (headers, requiredLabels) => {
   const headerSet = new Set(headers.map((header) => header.normalized))

   const missing = requiredLabels.filter((label) => !headerSet.has(String(label).toLowerCase()))

   if (missing.length) {
      throw new ValidationError(`Missing required column(s): ${missing.join(", ")}`)
   }
}

const readDataRows = (sheet, headers) => {
   const maxRows = getMaxRows()
   const maxCellLength = getMaxCellLength()
   const rows = []

   const lastRowNumber = sheet.actualRowCount || sheet.rowCount || 1

   if (lastRowNumber > maxRows + 1) {
      throw new ValidationError(`Workbook has more than ${maxRows} data rows (limit reached)`)
   }

   for (let rowNumber = 2; rowNumber <= lastRowNumber; rowNumber += 1) {
      const row = sheet.getRow(rowNumber)
      if (!row) continue

      const values = {}
      let hasContent = false

      for (const header of headers) {
         const cell = row.getCell(header.column)
         let value = readCellValue(cell)

         if (typeof value === "string") {
            value = value.trim()

            if (value.length > maxCellLength) {
               throw new ValidationError(`Row ${rowNumber} column "${header.label}" exceeds ${maxCellLength} characters`)
            }
         }

         if (value !== null && value !== undefined && value !== "") {
            hasContent = true
         }

         values[header.label] = value === undefined ? null : value
      }

      if (!hasContent) continue

      rows.push({
         row_number: rowNumber,
         values
      })
   }

   return rows
}

const readMetadata = (workbook) => {
   const meta = {
      template_version: null,
      decision_model_id: null,
      template_type: null,
      generated_at: null
   }

   const sheet = workbook.getWorksheet(META_SHEET_NAME)
   if (!sheet) return meta

   try {
      meta.template_version = normalizeText(readCellValue(sheet.getCell(META_TEMPLATE_VERSION_CELL))) || null
      meta.decision_model_id = Number(normalizeText(readCellValue(sheet.getCell(META_DECISION_MODEL_CELL)))) || null
      meta.template_type = normalizeText(readCellValue(sheet.getCell(META_TEMPLATE_TYPE_CELL))) || null
      meta.generated_at = normalizeText(readCellValue(sheet.getCell(META_GENERATED_AT_CELL))) || null
   } catch (error) {
      // Metadata kemungkinan dihapus user, abaikan saja
   }

   return meta
}

const verifyTemplateMetadata = (meta, { decisionModelId, templateType }) => {
   if (!meta) return

   if (meta.template_type && templateType && meta.template_type !== templateType) {
      throw new ValidationError(`Template type mismatch. Expected "${templateType}" but got "${meta.template_type}"`)
   }

   if (meta.decision_model_id && decisionModelId && Number(meta.decision_model_id) !== Number(decisionModelId)) {
      throw new ValidationError("Template was generated for a different decision model")
   }
}

const parseSheet = async ({ buffer, sheetName, requiredHeaders = [], decisionModelId, templateType }) => {
   const workbook = await loadWorkbookFromBuffer(buffer)
   const sheet = getWorksheetByName(workbook, sheetName)

   const headers = readHeaderRow(sheet)
   if (requiredHeaders.length) {
      ensureRequiredHeaders(headers, requiredHeaders)
   }

   const meta = readMetadata(workbook)

   if (decisionModelId !== undefined || templateType !== undefined) {
      verifyTemplateMetadata(meta, { decisionModelId, templateType })
   }

   const rows = readDataRows(sheet, headers)

   return {
      headers,
      rows,
      metadata: meta
   }
}

module.exports = {
   loadWorkbookFromBuffer,
   getWorksheetByName,
   readHeaderRow,
   ensureRequiredHeaders,
   readDataRows,
   readMetadata,
   verifyTemplateMetadata,
   parseSheet,
   readCellValue,
   normalizeText,
   META_SHEET_NAME,
   META_TEMPLATE_VERSION_CELL,
   META_DECISION_MODEL_CELL,
   META_TEMPLATE_TYPE_CELL,
   META_GENERATED_AT_CELL,
   TEMPLATE_META_PREFIX
}
