const ExcelJS = require("exceljs")

const parser = require("./workbook-parser.service")

const TEMPLATE_VERSION = process.env.IMPORT_TEMPLATE_VERSION || "1.0.0"

const HEADER_FILL = {
   type: "pattern",
   pattern: "solid",
   fgColor: { argb: "FF1F2937" }
}

const HEADER_FONT = {
   color: { argb: "FFFFFFFF" },
   bold: true,
   size: 11
}

const INSTRUCTION_HEADER_FONT = {
   bold: true,
   size: 13,
   color: { argb: "FF111827" }
}

const INSTRUCTION_BODY_FONT = {
   size: 11,
   color: { argb: "FF1F2937" }
}

const REFERENCE_HEADER_FILL = {
   type: "pattern",
   pattern: "solid",
   fgColor: { argb: "FFE5E7EB" }
}

const applyHeaderStyle = (row) => {
   row.eachCell((cell) => {
      cell.fill = HEADER_FILL
      cell.font = HEADER_FONT
      cell.alignment = { vertical: "middle", horizontal: "left" }
      cell.border = {
         top: { style: "thin", color: { argb: "FFD1D5DB" } },
         left: { style: "thin", color: { argb: "FFD1D5DB" } },
         bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
         right: { style: "thin", color: { argb: "FFD1D5DB" } }
      }
   })
   row.height = 24
}

const applyReferenceHeaderStyle = (row) => {
   row.eachCell((cell) => {
      cell.fill = REFERENCE_HEADER_FILL
      cell.font = { bold: true, color: { argb: "FF111827" } }
      cell.alignment = { vertical: "middle", horizontal: "left" }
   })
   row.height = 22
}

const writeMetadata = (sheetOrWorkbook, { decisionModelId, templateType }) => {
   const workbook = sheetOrWorkbook?.workbook || sheetOrWorkbook
   if (!workbook || typeof workbook.addWorksheet !== "function") {
      return null
   }

   let metaSheet = workbook.getWorksheet(parser.META_SHEET_NAME)

   if (!metaSheet) {
      metaSheet = workbook.addWorksheet(parser.META_SHEET_NAME, {
         state: "veryHidden",
         properties: { defaultRowHeight: 14 }
      })
      metaSheet.getColumn(1).width = 24
      metaSheet.getColumn(2).width = 36
   }

   metaSheet.getCell("A1").value = "template_version"
   metaSheet.getCell("A2").value = "decision_model_id"
   metaSheet.getCell("A3").value = "template_type"
   metaSheet.getCell("A4").value = "generated_at"

   metaSheet.getCell(parser.META_TEMPLATE_VERSION_CELL).value = TEMPLATE_VERSION
   metaSheet.getCell(parser.META_DECISION_MODEL_CELL).value = decisionModelId || null
   metaSheet.getCell(parser.META_TEMPLATE_TYPE_CELL).value = templateType
   metaSheet.getCell(parser.META_GENERATED_AT_CELL).value = new Date().toISOString()

   for (const ref of ["A1", "A2", "A3", "A4"]) {
      metaSheet.getCell(ref).font = { bold: true, color: { argb: "FF6B7280" }, size: 10 }
   }
   for (const ref of [
      parser.META_TEMPLATE_VERSION_CELL,
      parser.META_DECISION_MODEL_CELL,
      parser.META_TEMPLATE_TYPE_CELL,
      parser.META_GENERATED_AT_CELL
   ]) {
      metaSheet.getCell(ref).font = { color: { argb: "FF9CA3AF" }, size: 10, italic: true }
   }

   if (typeof metaSheet.state === "string") {
      metaSheet.state = "veryHidden"
   }

   return metaSheet
}

const createWorkbook = ({ creator = "DSS RBS-TOPSIS", description } = {}) => {
   const workbook = new ExcelJS.Workbook()
   workbook.creator = creator
   workbook.created = new Date()
   workbook.modified = new Date()
   if (description) {
      workbook.description = description
   }
   return workbook
}

const buildDataSheet = ({ workbook, sheetName, columns, sampleRows = [] }) => {
   const sheet = workbook.addWorksheet(sheetName, {
      properties: { defaultRowHeight: 20 }
   })

   sheet.columns = columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width || 24
   }))

   applyHeaderStyle(sheet.getRow(1))

   for (const sample of sampleRows) {
      sheet.addRow(sample)
   }

   sheet.views = [{ state: "frozen", ySplit: 1 }]

   return sheet
}

const buildReferenceSheet = ({ workbook, sheetName, columns, rows }) => {
   const sheet = workbook.addWorksheet(sheetName)
   sheet.columns = columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width || 22
   }))
   applyReferenceHeaderStyle(sheet.getRow(1))

   for (const row of rows) {
      sheet.addRow(row)
   }

   sheet.views = [{ state: "frozen", ySplit: 1 }]
   return sheet
}

const buildInstructionsSheet = ({ workbook, title, lines = [] }) => {
   const sheet = workbook.addWorksheet("Instructions")
   sheet.getColumn(1).width = 110

   sheet.addRow([title])
   sheet.getRow(1).font = INSTRUCTION_HEADER_FONT
   sheet.getRow(1).height = 26
   sheet.addRow([])

   for (const line of lines) {
      const row = sheet.addRow([line])
      row.font = INSTRUCTION_BODY_FONT
      row.alignment = { wrapText: true, vertical: "top" }
      row.height = Math.min(80, Math.max(20, Math.ceil(line.length / 90) * 18))
   }

   sheet.views = [{ state: "frozen", ySplit: 1 }]
   return sheet
}

const addDropdownValidation = (sheet, columnLetter, options, maxRow = 1000) => {
   if (!options || !options.length) return

   const formulae = [`"${options.map((value) => String(value).replace(/"/g, "")).join(",")}"`]

   for (let rowNumber = 2; rowNumber <= maxRow; rowNumber += 1) {
      const cellRef = `${columnLetter}${rowNumber}`
      sheet.getCell(cellRef).dataValidation = {
         type: "list",
         allowBlank: true,
         formulae
      }
   }
}

const addNumericValidation = (sheet, columnLetter, maxRow = 1000) => {
   for (let rowNumber = 2; rowNumber <= maxRow; rowNumber += 1) {
      const cellRef = `${columnLetter}${rowNumber}`
      sheet.getCell(cellRef).dataValidation = {
         type: "decimal",
         operator: "greaterThanOrEqual",
         allowBlank: true,
         formulae: [-1e12]
      }
   }
}

const writeWorkbookToBuffer = async (workbook) => {
   return workbook.xlsx.writeBuffer()
}

const columnLetterFor = (columnIndex) => {
   let result = ""
   let n = columnIndex

   while (n > 0) {
      const remainder = (n - 1) % 26
      result = String.fromCharCode(65 + remainder) + result
      n = Math.floor((n - 1) / 26)
   }

   return result
}

module.exports = {
   createWorkbook,
   buildDataSheet,
   buildReferenceSheet,
   buildInstructionsSheet,
   addDropdownValidation,
   addNumericValidation,
   writeMetadata,
   writeWorkbookToBuffer,
   columnLetterFor,
   TEMPLATE_VERSION
}
