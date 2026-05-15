const test = require("node:test")
const assert = require("node:assert/strict")
const ExcelJS = require("exceljs")

const { verifyMagicBytes } = require("../middleware/uploadExcel")

test("verifyMagicBytes accepts a real .xlsx buffer", async () => {
   const workbook = new ExcelJS.Workbook()
   workbook.addWorksheet("Sheet1").addRow(["hi"])
   const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
   await verifyMagicBytes(buffer)
})

test("verifyMagicBytes rejects empty buffer", async () => {
   await assert.rejects(verifyMagicBytes(Buffer.alloc(0)), /empty or unreadable/)
})

test("verifyMagicBytes rejects plain text", async () => {
   const buffer = Buffer.from("hello world this is not excel")
   await assert.rejects(verifyMagicBytes(buffer), /Unable to detect|not a valid/)
})

test("verifyMagicBytes rejects PDF", async () => {
   const buffer = Buffer.from("%PDF-1.4\n%fake pdf content for test")
   await assert.rejects(verifyMagicBytes(buffer), /not a valid \.xlsx/)
})
