const test = require("node:test")
const assert = require("node:assert/strict")
const ExcelJS = require("exceljs")

const Alternative = require("../models/alternative.model")
const validator = require("../service/import/alternatives/alternative-validator")
const alternativeImport = require("../service/import/alternatives/alternative-import.service")
const builder = require("../service/import/workbook-builder.service")

const buildWorkbookBuffer = async ({ decisionModelId, rows }) => {
   const workbook = new ExcelJS.Workbook()
   const sheet = workbook.addWorksheet("Alternatives")
   sheet.columns = [
      { header: "name", key: "name", width: 30 },
      { header: "description", key: "description", width: 50 }
   ]
   for (const row of rows) {
      sheet.addRow(row)
   }
   builder.writeMetadata(sheet, { decisionModelId, templateType: "alternatives" })

   return Buffer.from(await workbook.xlsx.writeBuffer())
}

test("validateRow flags missing name", () => {
   const result = validator.validateRow({ row_number: 2, values: { name: "", description: "x" } })
   assert.equal(result.errors.length, 1)
   assert.equal(result.errors[0].field, "name")
})

test("validateRow accepts valid row", () => {
   const result = validator.validateRow({ row_number: 2, values: { name: "Alpha ", description: " desc" } })
   assert.equal(result.errors.length, 0)
   assert.equal(result.data.name, "Alpha")
   assert.equal(result.data.description, "desc")
})

test("detectInFileDuplicates marks repeated names", () => {
   const validated = [
      { row_number: 2, errors: [], data: { name: "Alpha", description: null } },
      { row_number: 3, errors: [], data: { name: "alpha", description: null } },
      { row_number: 4, errors: [], data: { name: "Beta", description: null } }
   ]
   validator.detectInFileDuplicates(validated)
   assert.equal(validated[0].errors.length, 0)
   assert.equal(validated[1].errors.length, 1)
   assert.equal(validated[2].errors.length, 0)
})

test("buildPreview classifies create, update, and skip in upsert mode", async () => {
   const originalFindAll = Alternative.findAll
   Alternative.findAll = async () => ([
      { id: 11, name: "Existing One", description: "old" }
   ])

   try {
      const buffer = await buildWorkbookBuffer({
         decisionModelId: 1,
         rows: [
            { name: "Existing One", description: "fresh" },
            { name: "New Two", description: "" },
            { name: "", description: "missing name" }
         ]
      })

      const preview = await alternativeImport.buildPreview({
         buffer,
         decisionModelId: 1,
         mode: "upsert"
      })

      assert.equal(preview.summary.total_rows, 3)
      assert.equal(preview.summary.to_create, 1)
      assert.equal(preview.summary.to_update, 1)
      assert.equal(preview.summary.invalid_count, 1)
      assert.equal(preview.kind, "alternatives")

      const updateRow = preview.rows.find((row) => row.action === "update")
      assert.ok(updateRow)
      assert.equal(updateRow.existing_id, 11)

      const createRow = preview.rows.find((row) => row.action === "create")
      assert.ok(createRow)

      const invalidRow = preview.rows.find((row) => row.status === "invalid")
      assert.ok(invalidRow)
      assert.ok(invalidRow.errors.some((error) => error.message.includes("Name is required")))
   } finally {
      Alternative.findAll = originalFindAll
   }
})

test("buildPreview rejects duplicates in create_only mode", async () => {
   const originalFindAll = Alternative.findAll
   Alternative.findAll = async () => ([
      { id: 11, name: "Existing One", description: "old" }
   ])

   try {
      const buffer = await buildWorkbookBuffer({
         decisionModelId: 1,
         rows: [
            { name: "Existing One", description: "fresh" }
         ]
      })

      const preview = await alternativeImport.buildPreview({
         buffer,
         decisionModelId: 1,
         mode: "create_only"
      })

      const row = preview.rows[0]
      assert.equal(row.status, "conflict")
      assert.equal(row.action, "skip")
   } finally {
      Alternative.findAll = originalFindAll
   }
})
