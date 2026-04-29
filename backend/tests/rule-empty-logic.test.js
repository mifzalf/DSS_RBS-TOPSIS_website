const test = require("node:test")
const assert = require("node:assert/strict")

const ruleEngineService = require("../service/DSS/rule-engine.service")

test("isAllFactsEmpty returns true when all active variables are missing from the fact map", () => {
   const factMap = new Map()
   const result = ruleEngineService.isAllFactsEmpty({ factMap, activeVariableCodes: ["V1", "V2", "V3"] })

   assert.equal(result, true)
})

test("isAllFactsEmpty returns true when all active variables are false", () => {
   const factMap = new Map([
      ["V1", false],
      ["V2", false],
      ["V3", false]
   ])

   const result = ruleEngineService.isAllFactsEmpty({ factMap, activeVariableCodes: ["V1", "V2", "V3"] })

   assert.equal(result, true)
})

test("isAllFactsEmpty returns true when active variables are mixed null and false", () => {
   const factMap = new Map([
      ["V1", false],
      ["V2", null]
   ])

   const result = ruleEngineService.isAllFactsEmpty({ factMap, activeVariableCodes: ["V1", "V2", "V3"] })

   assert.equal(result, true)
})

test("isAllFactsEmpty returns false when at least one active variable is true", () => {
   const factMap = new Map([
      ["V1", false],
      ["V2", true],
      ["V3", false]
   ])

   const result = ruleEngineService.isAllFactsEmpty({ factMap, activeVariableCodes: ["V1", "V2", "V3"] })

   assert.equal(result, false)
})

test("isAllFactsEmpty returns false when there are no active variables", () => {
   const factMap = new Map()
   const result = ruleEngineService.isAllFactsEmpty({ factMap, activeVariableCodes: [] })

   assert.equal(result, false)
})
