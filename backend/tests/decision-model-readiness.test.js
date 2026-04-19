const test = require("node:test")
const assert = require("node:assert/strict")

const { buildReadinessSummary } = require("../service/decision-model.service")

test("buildReadinessSummary marks workspace ready when all required sections are complete", () => {
   const readiness = buildReadinessSummary({
      categoriesCount: 3,
      criteria: [{ weight: 0.5 }, { weight: 0.5 }],
      alternativesCount: 2,
      ruleVariablesCount: 2,
      rulesCount: 2,
      evaluationCount: 4,
      ruleEvaluationCount: 4,
      recommendationCount: 1,
      gradePolicies: [
         { ranges: [{ id: 1 }] },
         { ranges: [{ id: 2 }] }
      ]
   })

   assert.equal(readiness.has_categories, true)
   assert.equal(readiness.has_balanced_weights, true)
   assert.equal(readiness.has_complete_topsis_evaluations, true)
   assert.equal(readiness.has_rule_evaluations, true)
   assert.equal(readiness.is_ready, true)
   assert.equal(readiness.overall_progress, 100)
})

test("buildReadinessSummary reports incomplete readiness when key sections are missing", () => {
   const readiness = buildReadinessSummary({
      categoriesCount: 0,
      criteria: [{ weight: 0.3 }],
      alternativesCount: 1,
      ruleVariablesCount: 0,
      rulesCount: 0,
      evaluationCount: 0,
      ruleEvaluationCount: 0,
      recommendationCount: 0,
      gradePolicies: []
   })

   assert.equal(readiness.has_categories, false)
   assert.equal(readiness.has_grade_policies, false)
   assert.equal(readiness.has_balanced_weights, false)
   assert.equal(readiness.is_ready, false)
   assert.ok(readiness.overall_progress < 100)
})
