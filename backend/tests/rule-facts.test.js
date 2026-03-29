const test = require("node:test")
const assert = require("node:assert/strict")

const ruleEvaluationService = require("../service/rule-evaluation.service")
const ruleEngineService = require("../service/DSS/rule-engine.service")
const { RULE_VARIABLE_TYPES } = require("../constants/rule-variable-types")

test("getTypedPayload maps boolean rule variable values", () => {
   const payload = ruleEvaluationService.getTypedPayload({
      ruleVariable: { value_type: RULE_VARIABLE_TYPES.BOOLEAN },
      value_boolean: true
   })

   assert.deepEqual(payload, {
      value_boolean: true,
      value_number: null,
      value_string: null
   })
})

test("getTypedPayload maps number rule variable values", () => {
   const payload = ruleEvaluationService.getTypedPayload({
      ruleVariable: { value_type: RULE_VARIABLE_TYPES.NUMBER },
      value_number: 3
   })

   assert.deepEqual(payload, {
      value_boolean: null,
      value_number: 3,
      value_string: null
   })
})

test("getTypedPayload maps string rule variable values", () => {
   const payload = ruleEvaluationService.getTypedPayload({
      ruleVariable: { value_type: RULE_VARIABLE_TYPES.STRING },
      value_string: " yes "
   })

   assert.deepEqual(payload, {
      value_boolean: null,
      value_number: null,
      value_string: "yes"
   })
})

test("rule engine normalizes boolean fact values from rule evaluations", () => {
   const factValue = ruleEngineService.getRuleEvaluationValue({
      ruleVariable: { value_type: RULE_VARIABLE_TYPES.BOOLEAN },
      value_boolean: false
   })

   assert.equal(factValue, false)
})
