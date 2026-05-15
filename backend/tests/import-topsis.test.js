const test = require("node:test")
const assert = require("node:assert/strict")
const ExcelJS = require("exceljs")

const Alternative = require("../models/alternative.model")
const Criteria = require("../models/criteria.model")
const Evaluation = require("../models/evaluation.model")

const validator = require("../service/import/topsis-evaluations/topsis-validator")
const topsisImport = require("../service/import/topsis-evaluations/topsis-import.service")
const topsisTemplate = require("../service/import/topsis-evaluations/topsis-template")
const builder = require("../service/import/workbook-builder.service")

test("splitHeader parses code and name", () => {
   const parsed = validator.splitHeader("C1 (Penghasilan)")
   assert.deepEqual(parsed, { code: "C1", name: "Penghasilan", raw: "C1 (Penghasilan)" })
})

test("matchCriteriaForHeader prefers code over name", () => {
   const criteriaList = [
      { id: 1, code: "C1", name: "Income", sub_criteria: [] },
      { id: 2, code: "C2", name: "Penghasilan", sub_criteria: [] }
   ]
   const matched = validator.matchCriteriaForHeader("C1 (Anything)", criteriaList)
   assert.equal(matched.id, 1)
})

const buildEvaluationsBuffer = async ({ decisionModelId, headers, rows }) => {
   const workbook = new ExcelJS.Workbook()
   const sheet = workbook.addWorksheet("Evaluations")
   sheet.columns = headers.map((header) => ({ header, key: header, width: 24 }))
   for (const row of rows) sheet.addRow(row)
   builder.writeMetadata(sheet, { decisionModelId, templateType: "topsis_evaluations" })
   return Buffer.from(await workbook.xlsx.writeBuffer())
}

test("buildPreview validates alternative_name and sub-criteria", async () => {
   const originalAlternativeFindAll = Alternative.findAll
   const originalCriteriaFindAll = Criteria.findAll
   const originalEvaluationFindAll = Evaluation.findAll

   Alternative.findAll = async () => ([
      { id: 1, name: "Rumah Tangga A" },
      { id: 2, name: "Rumah Tangga B" }
   ])

   Criteria.findAll = async () => ([
      {
         id: 10,
         code: "C1",
         name: "Penghasilan",
         type: "cost",
         weight: 0.3,
         status_active: true,
         subCriteria: [
            { id: 100, label: "Rendah", value: 5 },
            { id: 101, label: "Sedang", value: 3 },
            { id: 102, label: "Tinggi", value: 1 }
         ]
      },
      {
         id: 20,
         code: "C2",
         name: "Tanggungan",
         type: "benefit",
         weight: 0.7,
         status_active: true,
         subCriteria: [
            { id: 200, label: "Sedikit", value: 1 },
            { id: 201, label: "Banyak", value: 5 }
         ]
      }
   ])

   Evaluation.findAll = async () => ([
      { id: 999, alternative_id: 1, criteria_id: 10, sub_criteria_id: 100 }
   ])

   try {
      const buffer = await buildEvaluationsBuffer({
         decisionModelId: 7,
         headers: ["alternative_name", "C1 (Penghasilan)", "C2 (Tanggungan)"],
         rows: [
            { alternative_name: "Rumah Tangga A", "C1 (Penghasilan)": "Sedang", "C2 (Tanggungan)": "Banyak" },
            { alternative_name: "Rumah Tangga B", "C1 (Penghasilan)": "Rendah", "C2 (Tanggungan)": "Tidak Ada" },
            { alternative_name: "Tidak Ada", "C1 (Penghasilan)": "Rendah", "C2 (Tanggungan)": "Banyak" }
         ]
      })

      const preview = await topsisImport.buildPreview({
         buffer,
         decisionModelId: 7,
         mode: "upsert"
      })

      assert.equal(preview.kind, "topsis_evaluations")
      assert.equal(preview.summary.total_rows, 3)
      assert.equal(preview.summary.invalid_count, 2)

      const validRow = preview.rows.find((row) => row.data.alternative_name === "Rumah Tangga A")
      assert.equal(validRow.summary.to_update, 1)
      assert.equal(validRow.summary.to_create, 1)
      assert.equal(validRow.status, "conflict")

      const wrongSubCriteriaRow = preview.rows.find((row) => row.data.alternative_name === "Rumah Tangga B")
      assert.ok(wrongSubCriteriaRow.errors.some((error) => /Sub-criteria/.test(error.message)))

      const unknownAlternativeRow = preview.rows.find((row) => row.data.alternative_name === "Tidak Ada")
      assert.ok(unknownAlternativeRow.errors.some((error) => /not found/.test(error.message)))
   } finally {
      Alternative.findAll = originalAlternativeFindAll
      Criteria.findAll = originalCriteriaFindAll
      Evaluation.findAll = originalEvaluationFindAll
   }
})

test("template generator builds expected sheets", async () => {
   const originalCriteriaFindAll = Criteria.findAll
   Criteria.findAll = async () => ([
      {
         id: 1,
         code: "C1",
         name: "Penghasilan",
         type: "cost",
         weight: 0.5,
         subCriteria: [
            { id: 100, label: "Rendah", value: 5 },
            { id: 101, label: "Tinggi", value: 1 }
         ]
      }
   ])

   try {
      const { workbook } = await topsisTemplate.buildTopsisTemplate({
         decisionModelId: 1,
         decisionModelName: "Test",
         alternatives: [{ id: 1, name: "A" }],
         existingEvaluations: []
      })

      const buffer = Buffer.from(await builder.writeWorkbookToBuffer(workbook))
      const reader = new ExcelJS.Workbook()
      await reader.xlsx.load(buffer)

      assert.ok(reader.getWorksheet("Evaluations"))
      assert.ok(reader.getWorksheet("Reference"))
      assert.ok(reader.getWorksheet("Instructions"))
      assert.ok(reader.getWorksheet("Summary"))

      const evalSheet = reader.getWorksheet("Evaluations")
      const headerRow = evalSheet.getRow(1)
      const headerLabels = headerRow.values.filter((value) => value !== null && value !== undefined)
      assert.ok(headerLabels.includes("alternative_name"))
      assert.ok(headerLabels.some((label) => String(label).includes("C1")))
      assert.ok(headerLabels.includes(topsisTemplate.STATUS_COLUMN_KEY))
   } finally {
      Criteria.findAll = originalCriteriaFindAll
   }
})

test("template includes all alternatives and pre-fills existing evaluations", async () => {
   const originalCriteriaFindAll = Criteria.findAll
   Criteria.findAll = async () => ([
      {
         id: 10,
         code: "C1",
         name: "Penghasilan",
         type: "cost",
         weight: 0.4,
         subCriteria: [
            { id: 100, label: "Rendah", value: 5 },
            { id: 101, label: "Sedang", value: 3 }
         ]
      },
      {
         id: 20,
         code: "C2",
         name: "Tanggungan",
         type: "benefit",
         weight: 0.6,
         subCriteria: [
            { id: 200, label: "Sedikit", value: 1 },
            { id: 201, label: "Banyak", value: 5 }
         ]
      }
   ])

   try {
      const alternatives = [
         { id: 1, name: "Alpha" },
         { id: 2, name: "Beta" },
         { id: 3, name: "Gamma" }
      ]
      const existingEvaluations = [
         { id: 999, alternative_id: 1, criteria_id: 10, sub_criteria_id: 100 }, // partial
         { id: 998, alternative_id: 2, criteria_id: 10, sub_criteria_id: 101 }, // complete row 2 part 1
         { id: 997, alternative_id: 2, criteria_id: 20, sub_criteria_id: 201 } // complete row 2 part 2
      ]

      const result = await topsisTemplate.buildTopsisTemplate({
         decisionModelId: 1,
         decisionModelName: "Test",
         alternatives,
         existingEvaluations
      })

      assert.deepEqual(result.statusSummary, { complete: 1, partial: 1, empty: 1 })

      const buffer = Buffer.from(await builder.writeWorkbookToBuffer(result.workbook))
      const reader = new ExcelJS.Workbook()
      await reader.xlsx.load(buffer)

      const sheet = reader.getWorksheet("Evaluations")
      const headerCells = sheet.getRow(1).values.filter(Boolean)
      const c1ColumnIndex = headerCells.indexOf("C1 (Penghasilan)") + 1
      const c2ColumnIndex = headerCells.indexOf("C2 (Tanggungan)") + 1
      const statusColumnIndex = headerCells.indexOf(topsisTemplate.STATUS_COLUMN_KEY) + 1

      assert.ok(c1ColumnIndex > 0)
      assert.ok(c2ColumnIndex > 0)
      assert.ok(statusColumnIndex > 0)

      // Row 2 = Alpha (partial), Row 3 = Beta (complete), Row 4 = Gamma (empty)
      assert.equal(sheet.getRow(2).getCell(c1ColumnIndex).value, "Rendah")
      assert.equal(sheet.getRow(2).getCell(c2ColumnIndex).value, "")
      assert.equal(sheet.getRow(2).getCell(statusColumnIndex).value, topsisTemplate.STATUS_LABELS.partial)

      assert.equal(sheet.getRow(3).getCell(c1ColumnIndex).value, "Sedang")
      assert.equal(sheet.getRow(3).getCell(c2ColumnIndex).value, "Banyak")
      assert.equal(sheet.getRow(3).getCell(statusColumnIndex).value, topsisTemplate.STATUS_LABELS.complete)

      assert.equal(sheet.getRow(4).getCell(c1ColumnIndex).value, "")
      assert.equal(sheet.getRow(4).getCell(c2ColumnIndex).value, "")
      assert.equal(sheet.getRow(4).getCell(statusColumnIndex).value, topsisTemplate.STATUS_LABELS.empty)
   } finally {
      Criteria.findAll = originalCriteriaFindAll
   }
})

test("import service ignores _status meta column on upload", async () => {
   const originalAlternativeFindAll = Alternative.findAll
   const originalCriteriaFindAll = Criteria.findAll
   const originalEvaluationFindAll = Evaluation.findAll

   Alternative.findAll = async () => ([{ id: 1, name: "Alpha" }])
   Criteria.findAll = async () => ([
      {
         id: 10,
         code: "C1",
         name: "Penghasilan",
         type: "cost",
         weight: 0.5,
         subCriteria: [
            { id: 100, label: "Rendah", value: 5 }
         ]
      }
   ])
   Evaluation.findAll = async () => ([])

   try {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet("Evaluations")
      sheet.columns = [
         { header: "alternative_name", key: "alternative_name", width: 24 },
         { header: "C1 (Penghasilan)", key: "C1", width: 24 },
         { header: "_status", key: "_status", width: 18 }
      ]
      sheet.addRow({ alternative_name: "Alpha", C1: "Rendah", _status: "✓ Lengkap" })
      builder.writeMetadata(sheet, { decisionModelId: 5, templateType: "topsis_evaluations" })
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

      const preview = await topsisImport.buildPreview({
         buffer,
         decisionModelId: 5,
         mode: "upsert"
      })

      // _status header should not generate "unknown_criteria" warning
      assert.equal(preview.warnings.length, 0)
      const row = preview.rows[0]
      assert.equal(row.errors.length, 0)
      assert.equal(row.summary.to_create, 1)
   } finally {
      Alternative.findAll = originalAlternativeFindAll
      Criteria.findAll = originalCriteriaFindAll
      Evaluation.findAll = originalEvaluationFindAll
   }
})
