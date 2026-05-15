const test = require("node:test")
const assert = require("node:assert/strict")
const ExcelJS = require("exceljs")

const Alternative = require("../models/alternative.model")
const RuleVariable = require("../models/rule-variable.model")
const RuleEvaluation = require("../models/rule-evaluation.model")

const validator = require("../service/import/rule-evaluations/rule-evaluation-validator")
const ruleEvaluationImport = require("../service/import/rule-evaluations/rule-evaluation-import.service")
const ruleEvaluationTemplate = require("../service/import/rule-evaluations/rule-evaluation-template")
const builder = require("../service/import/workbook-builder.service")
const { RULE_VARIABLE_TYPES } = require("../constants/rule-variable-types")

test("matchVariableForHeader resolves by code first, then name", () => {
   const variables = [
      { id: 1, code: "punya_kks", name: "Punya KKS", value_type: "boolean" },
      { id: 2, code: "penghasilan", name: "Penghasilan", value_type: "number" }
   ]
   const byCode = validator.matchVariableForHeader("punya_kks", variables)
   assert.equal(byCode.id, 1)
   const byName = validator.matchVariableForHeader("penghasilan", variables)
   assert.equal(byName.id, 2)
   const none = validator.matchVariableForHeader("unknown", variables)
   assert.equal(none, null)
})

test("coerceCellValue maps each value_type correctly", () => {
   const booleanCell = validator.coerceCellValue({
      rawValue: "ya",
      variable: { value_type: RULE_VARIABLE_TYPES.BOOLEAN }
   })
   assert.equal(booleanCell.value, true)
   assert.equal(booleanCell.kind, RULE_VARIABLE_TYPES.BOOLEAN)

   const numberCell = validator.coerceCellValue({
      rawValue: "1.500,5",
      variable: { value_type: RULE_VARIABLE_TYPES.NUMBER }
   })
   assert.ok(numberCell.error || numberCell.value === undefined || Number.isFinite(numberCell.value))
   const numberCellSimple = validator.coerceCellValue({
      rawValue: "500",
      variable: { value_type: RULE_VARIABLE_TYPES.NUMBER }
   })
   assert.equal(numberCellSimple.value, 500)

   const stringCell = validator.coerceCellValue({
      rawValue: "  hello world ",
      variable: { value_type: RULE_VARIABLE_TYPES.STRING }
   })
   assert.equal(stringCell.value, "hello world")

   const emptyCell = validator.coerceCellValue({
      rawValue: "",
      variable: { value_type: RULE_VARIABLE_TYPES.STRING }
   })
   assert.equal(emptyCell.isEmpty, true)
})

test("buildEvaluationPayload writes only the matching column", () => {
   const payload = validator.buildEvaluationPayload({
      alternativeId: 5,
      variable: { id: 9, value_type: RULE_VARIABLE_TYPES.BOOLEAN },
      coerced: { kind: RULE_VARIABLE_TYPES.BOOLEAN, value: true }
   })

   assert.deepEqual(payload, {
      alternative_id: 5,
      rule_variable_id: 9,
      value_boolean: true,
      value_number: null,
      value_string: null
   })
})

test("valuesEqual treats nullish strings consistently", () => {
   const equalEmpty = validator.valuesEqual({
      existing: { value_boolean: null, value_number: null, value_string: null },
      payload: { value_boolean: null, value_number: null, value_string: "" }
   })
   assert.equal(equalEmpty, true)
})

const buildBuffer = async ({ decisionModelId, headers, rows }) => {
   const workbook = new ExcelJS.Workbook()
   const sheet = workbook.addWorksheet("RuleEvaluations")
   sheet.columns = headers.map((header) => ({ header, key: header, width: 22 }))
   for (const row of rows) sheet.addRow(row)
   builder.writeMetadata(sheet, { decisionModelId, templateType: "rule_evaluations" })
   return Buffer.from(await workbook.xlsx.writeBuffer())
}

test("buildPreview classifies cells per type", async () => {
   const originalAlternative = Alternative.findAll
   const originalVariable = RuleVariable.findAll
   const originalEvaluation = RuleEvaluation.findAll

   Alternative.findAll = async () => ([
      { id: 1, name: "Rumah A" }
   ])
   RuleVariable.findAll = async () => ([
      { id: 10, code: "punya_kks", name: "Punya KKS", value_type: "boolean", description: "" },
      { id: 11, code: "penghasilan", name: "Penghasilan", value_type: "number", description: "" },
      { id: 12, code: "status_rumah", name: "Status Rumah", value_type: "string", description: "" }
   ])
   RuleEvaluation.findAll = async () => ([
      { id: 100, alternative_id: 1, rule_variable_id: 10, value_boolean: false, value_number: null, value_string: null }
   ])

   try {
      const buffer = await buildBuffer({
         decisionModelId: 1,
         headers: ["alternative_name", "punya_kks", "penghasilan", "status_rumah"],
         rows: [
            { alternative_name: "Rumah A", punya_kks: "ya", penghasilan: "1500000", status_rumah: "kontrak" },
            { alternative_name: "Tidak Ada", punya_kks: "true", penghasilan: "1000", status_rumah: "milik" },
            { alternative_name: "Rumah A", punya_kks: "maybe", penghasilan: "abc", status_rumah: "" }
         ]
      })

      const preview = await ruleEvaluationImport.buildPreview({
         buffer,
         decisionModelId: 1,
         mode: "upsert"
      })

      assert.equal(preview.kind, "rule_evaluations")
      assert.equal(preview.summary.total_rows, 3)

      const goodRow = preview.rows[0]
      assert.equal(goodRow.summary.to_update, 1)
      assert.equal(goodRow.summary.to_create, 2)

      const unknownAlternativeRow = preview.rows[1]
      assert.ok(unknownAlternativeRow.errors.some((error) => /not found/.test(error.message)))

      const invalidValueRow = preview.rows[2]
      assert.ok(invalidValueRow.errors.some((error) => /Value must be/.test(error.message)))
   } finally {
      Alternative.findAll = originalAlternative
      RuleVariable.findAll = originalVariable
      RuleEvaluation.findAll = originalEvaluation
   }
})

test("rule evaluation template includes required sheets", async () => {
   const originalVariable = RuleVariable.findAll
   RuleVariable.findAll = async () => ([
      { id: 10, code: "punya_kks", name: "Punya KKS", value_type: "boolean", description: "Memiliki KKS" }
   ])

   try {
      const { workbook } = await ruleEvaluationTemplate.buildRuleEvaluationTemplate({
         decisionModelId: 1,
         decisionModelName: "Test",
         alternatives: [{ id: 1, name: "Sample" }],
         existingEvaluations: []
      })

      const buffer = Buffer.from(await builder.writeWorkbookToBuffer(workbook))
      const reader = new ExcelJS.Workbook()
      await reader.xlsx.load(buffer)

      assert.ok(reader.getWorksheet("RuleEvaluations"))
      assert.ok(reader.getWorksheet("Reference"))
      assert.ok(reader.getWorksheet("Instructions"))
      assert.ok(reader.getWorksheet("Summary"))
   } finally {
      RuleVariable.findAll = originalVariable
   }
})

test("rule evaluation template pre-fills existing values for each value_type", async () => {
   const originalVariable = RuleVariable.findAll
   RuleVariable.findAll = async () => ([
      { id: 10, code: "punya_kks", name: "Punya KKS", value_type: "boolean", description: "" },
      { id: 11, code: "penghasilan", name: "Penghasilan", value_type: "number", description: "" },
      { id: 12, code: "status_rumah", name: "Status Rumah", value_type: "string", description: "" }
   ])

   try {
      const alternatives = [
         { id: 1, name: "Alpha" },
         { id: 2, name: "Beta" }
      ]
      const existingEvaluations = [
         { id: 1, alternative_id: 1, rule_variable_id: 10, value_boolean: true, value_number: null, value_string: null },
         { id: 2, alternative_id: 1, rule_variable_id: 11, value_boolean: null, value_number: 1500000, value_string: null },
         { id: 3, alternative_id: 1, rule_variable_id: 12, value_boolean: null, value_number: null, value_string: "kontrak" }
      ]

      const result = await ruleEvaluationTemplate.buildRuleEvaluationTemplate({
         decisionModelId: 1,
         decisionModelName: "Test",
         alternatives,
         existingEvaluations
      })

      assert.deepEqual(result.statusSummary, { complete: 1, partial: 0, empty: 1 })

      const buffer = Buffer.from(await builder.writeWorkbookToBuffer(result.workbook))
      const reader = new ExcelJS.Workbook()
      await reader.xlsx.load(buffer)

      const sheet = reader.getWorksheet("RuleEvaluations")
      const headerCells = sheet.getRow(1).values.filter(Boolean)
      const booleanColumn = headerCells.indexOf("punya_kks") + 1
      const numberColumn = headerCells.indexOf("penghasilan") + 1
      const stringColumn = headerCells.indexOf("status_rumah") + 1
      const statusColumn = headerCells.indexOf(ruleEvaluationTemplate.STATUS_COLUMN_KEY) + 1

      assert.equal(sheet.getRow(2).getCell(booleanColumn).value, "true")
      assert.equal(sheet.getRow(2).getCell(numberColumn).value, 1500000)
      assert.equal(sheet.getRow(2).getCell(stringColumn).value, "kontrak")
      assert.equal(sheet.getRow(2).getCell(statusColumn).value, ruleEvaluationTemplate.STATUS_LABELS.complete)

      assert.equal(sheet.getRow(3).getCell(booleanColumn).value, "")
      assert.equal(sheet.getRow(3).getCell(numberColumn).value, "")
      assert.equal(sheet.getRow(3).getCell(stringColumn).value, "")
      assert.equal(sheet.getRow(3).getCell(statusColumn).value, ruleEvaluationTemplate.STATUS_LABELS.empty)
   } finally {
      RuleVariable.findAll = originalVariable
   }
})

test("rule evaluation import ignores _status meta column on upload", async () => {
   const originalAlternative = Alternative.findAll
   const originalVariable = RuleVariable.findAll
   const originalEvaluation = RuleEvaluation.findAll

   Alternative.findAll = async () => ([{ id: 1, name: "Alpha" }])
   RuleVariable.findAll = async () => ([
      { id: 10, code: "punya_kks", name: "Punya KKS", value_type: "boolean", description: "" }
   ])
   RuleEvaluation.findAll = async () => ([])

   try {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet("RuleEvaluations")
      sheet.columns = [
         { header: "alternative_name", key: "alternative_name", width: 22 },
         { header: "punya_kks", key: "punya_kks", width: 18 },
         { header: "_status", key: "_status", width: 18 }
      ]
      sheet.addRow({ alternative_name: "Alpha", punya_kks: "true", _status: "✓ Lengkap" })
      builder.writeMetadata(sheet, { decisionModelId: 1, templateType: "rule_evaluations" })
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

      const preview = await ruleEvaluationImport.buildPreview({
         buffer,
         decisionModelId: 1,
         mode: "upsert"
      })

      const row = preview.rows[0]
      assert.equal(row.errors.length, 0)
      assert.equal(row.summary.to_create, 1)
   } finally {
      Alternative.findAll = originalAlternative
      RuleVariable.findAll = originalVariable
      RuleEvaluation.findAll = originalEvaluation
   }
})
