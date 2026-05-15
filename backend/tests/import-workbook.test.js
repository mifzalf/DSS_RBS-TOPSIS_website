const test = require("node:test")
const assert = require("node:assert/strict")
const ExcelJS = require("exceljs")

const parser = require("../service/import/workbook-parser.service")
const builder = require("../service/import/workbook-builder.service")
const alternativeTemplate = require("../service/import/alternatives/alternative-template")

test("workbook parser reads header row and data rows", async () => {
   const workbook = new ExcelJS.Workbook()
   const sheet = workbook.addWorksheet("Alternatives")
   sheet.columns = [
      { header: "name", key: "name" },
      { header: "description", key: "description" }
   ]
   sheet.addRow({ name: "Alpha", description: "First" })
   sheet.addRow({ name: "Beta", description: "Second" })
   sheet.addRow({ name: "", description: "" })
   sheet.addRow({ name: "Gamma", description: null })

   const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

   const parsed = await parser.parseSheet({
      buffer,
      sheetName: "Alternatives",
      requiredHeaders: ["name", "description"]
   })

   assert.equal(parsed.headers.length, 2)
   assert.equal(parsed.rows.length, 3)
   assert.equal(parsed.rows[0].values.name, "Alpha")
   assert.equal(parsed.rows[2].values.name, "Gamma")
})

test("workbook parser rejects missing required headers", async () => {
   const workbook = new ExcelJS.Workbook()
   const sheet = workbook.addWorksheet("Alternatives")
   sheet.columns = [{ header: "title", key: "title" }]
   sheet.addRow({ title: "Hello" })

   const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

   await assert.rejects(
      parser.parseSheet({
         buffer,
         sheetName: "Alternatives",
         requiredHeaders: ["name"]
      }),
      /Missing required column/
   )
})

test("workbook parser rejects wrong sheet name", async () => {
   const workbook = new ExcelJS.Workbook()
   const sheet = workbook.addWorksheet("WrongSheet")
   sheet.columns = [{ header: "name", key: "name" }]
   sheet.addRow({ name: "Alpha" })

   const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

   await assert.rejects(
      parser.parseSheet({
         buffer,
         sheetName: "Alternatives",
         requiredHeaders: ["name"]
      }),
      /not found/
   )
})

test("alternative template generator produces a readable workbook", async () => {
   const workbook = alternativeTemplate.buildAlternativeTemplate({
      decisionModelId: 99,
      decisionModelName: "Test"
   })

   const buffer = Buffer.from(await builder.writeWorkbookToBuffer(workbook))

   const parsed = await parser.parseSheet({
      buffer,
      sheetName: alternativeTemplate.TEMPLATE_TYPE === "alternatives" ? "Alternatives" : "Alternatives",
      requiredHeaders: ["name", "description"],
      decisionModelId: 99,
      templateType: "alternatives"
   })

   assert.equal(parsed.metadata.template_type, "alternatives")
   assert.equal(Number(parsed.metadata.decision_model_id), 99)
   assert.ok(parsed.rows.length >= 1)
})

test("template metadata mismatch is rejected", async () => {
   const workbook = alternativeTemplate.buildAlternativeTemplate({
      decisionModelId: 1,
      decisionModelName: "Test"
   })
   const buffer = Buffer.from(await builder.writeWorkbookToBuffer(workbook))

   await assert.rejects(
      parser.parseSheet({
         buffer,
         sheetName: "Alternatives",
         requiredHeaders: ["name", "description"],
         decisionModelId: 999,
         templateType: "alternatives"
      }),
      /different decision model/
   )
})

test("columnLetterFor maps indexes correctly", () => {
   assert.equal(builder.columnLetterFor(1), "A")
   assert.equal(builder.columnLetterFor(26), "Z")
   assert.equal(builder.columnLetterFor(27), "AA")
   assert.equal(builder.columnLetterFor(52), "AZ")
   assert.equal(builder.columnLetterFor(53), "BA")
})
