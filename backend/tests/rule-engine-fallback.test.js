const test = require("node:test")
const assert = require("node:assert/strict")

const Alternative = require("../models/alternative.model")
const Rule = require("../models/rule.model")
const AssistanceCategory = require("../models/assistance-category.model")
const RuleVariable = require("../models/rule-variable.model")
const RuleEvaluation = require("../models/rule-evaluation.model")
const ruleEngineService = require("../service/DSS/rule-engine.service")

test("runRuleEngine falls back to the first active rejected category when code is not not_eligible", async () => {
   const originalAlternativeFindAll = Alternative.findAll
   const originalRuleFindAll = Rule.findAll
   const originalCategoryFindAll = AssistanceCategory.findAll
   const originalRuleVariableFindAll = RuleVariable.findAll
   const originalRuleEvaluationFindAll = RuleEvaluation.findAll

   Alternative.findAll = async () => ([
      { id: 101, decision_model_id: 2, name: "Alt A" }
   ])
   Rule.findAll = async () => ([])
   AssistanceCategory.findAll = async () => ([
      { id: 4, decision_model_id: 2, code: "B0", name: "Tidak Memenuhi Syarat", is_ranked: false, status_active: true }
   ])
   RuleVariable.findAll = async () => ([])
   RuleEvaluation.findAll = async () => ([])

   try {
      const results = await ruleEngineService.runRuleEngine(2)

      assert.equal(results.length, 1)
      assert.equal(results[0].category_id, 4)
      assert.equal(results[0].category, "Tidak Memenuhi Syarat")
      assert.equal(results[0].is_ranked, false)
   } finally {
      Alternative.findAll = originalAlternativeFindAll
      Rule.findAll = originalRuleFindAll
      AssistanceCategory.findAll = originalCategoryFindAll
      RuleVariable.findAll = originalRuleVariableFindAll
      RuleEvaluation.findAll = originalRuleEvaluationFindAll
   }
})
