const test = require("node:test")
const assert = require("node:assert/strict")

const topsis = require("../service/DSS/topsis.service")
const recommendationService = require("../service/DSS/recommendation.service")
const ruleEngineService = require("../service/DSS/rule-engine.service")
const { DEFAULT_REJECTED_CATEGORY, RULE_ACTION_TYPES } = require("../constants/rule-actions")

test("calculateTopsis ranks alternatives by descending score", () => {
   const matrix = [
      [5, 3],
      [4, 4],
      [3, 5]
   ]

   const criteria = [
      { weight: 0.6, type: "benefit" },
      { weight: 0.4, type: "cost" }
   ]

   const result = topsis.calculateTopsis(matrix, criteria)

   assert.equal(result.length, 3)
   assert.deepEqual(result.map((item) => item.rank), [1, 2, 3])
   assert.ok(result[0].score >= result[1].score)
   assert.ok(result[1].score >= result[2].score)
})

test("calculateTopsis returns empty array for empty inputs", () => {
   assert.deepEqual(topsis.calculateTopsis([], []), [])
   assert.deepEqual(topsis.calculateTopsis([[1, 2]], []), [])
   assert.deepEqual(topsis.calculateTopsis([], [{ weight: 1, type: "benefit" }]), [])
})

test("rule groups preserve ranked and rejected categories", () => {
   const groups = recommendationService.groupRuleResultsByCategory([
      { alternative_id: 1, category: "PKH", action_type: RULE_ACTION_TYPES.ASSIGN_BENEFIT, is_ranked: true },
      { alternative_id: 2, category: "PKH", action_type: RULE_ACTION_TYPES.ASSIGN_BENEFIT, is_ranked: true },
      { alternative_id: 3, category: "Tidak lulus", action_type: RULE_ACTION_TYPES.REJECT, is_ranked: false }
   ])

   assert.deepEqual(Object.keys(groups), ["PKH", "Tidak lulus"])
   assert.equal(groups.PKH.isRanked, true)
   assert.equal(groups["Tidak lulus"].isRanked, false)
   assert.equal(groups.PKH.items.length, 2)
   assert.equal(groups["Tidak lulus"].items.length, 1)
})

test("rejected groups skip TOPSIS fields", () => {
   const results = recommendationService.generateRejectedGroupResults({
      decisionModelId: 9,
      categoryGroup: {
         category: "Tidak lulus",
         actionType: RULE_ACTION_TYPES.REJECT,
         items: [{ alternative_id: 4 }, { alternative_id: 8 }]
      }
   })

   assert.deepEqual(results, [
      {
         decision_model_id: 9,
         alternative_id: 4,
         category: "Tidak lulus",
         action_type: RULE_ACTION_TYPES.REJECT,
         preference_score: null,
         rank: null,
         status: "rejected"
      },
      {
         decision_model_id: 9,
         alternative_id: 8,
         category: "Tidak lulus",
         action_type: RULE_ACTION_TYPES.REJECT,
         preference_score: null,
         rank: null,
         status: "rejected"
      }
   ])
})

test("rule engine classification treats reject actions as non-ranked", () => {
   assert.equal(ruleEngineService.isRankedCategory({ actionType: RULE_ACTION_TYPES.REJECT, category: "PKH" }), false)
   assert.equal(ruleEngineService.isRankedCategory({ actionType: RULE_ACTION_TYPES.ASSIGN_BENEFIT, category: "Tidak lulus" }), false)
   assert.equal(ruleEngineService.isRankedCategory({ actionType: RULE_ACTION_TYPES.ASSIGN_BENEFIT, category: "PKH" }), true)
})

test("grouping uses official fallback category for unmatched alternatives", () => {
   const groups = recommendationService.groupRuleResultsByCategory([
      {
         alternative_id: 10,
         category: DEFAULT_REJECTED_CATEGORY,
         action_type: RULE_ACTION_TYPES.REJECT,
         is_ranked: false
      }
   ])

   assert.ok(groups[DEFAULT_REJECTED_CATEGORY])
   assert.equal(groups[DEFAULT_REJECTED_CATEGORY].isRanked, false)
})

test("serializeGroupedResponse separates ranked and rejected groups", () => {
   const grouped = recommendationService.serializeGroupedResponse(
      [
         {
            alternative_id: 1,
            category: "PKH",
            action_type: RULE_ACTION_TYPES.ASSIGN_BENEFIT,
            preference_score: 0.88,
            rank: 1,
            status: "ranked"
         },
         {
            alternative_id: 2,
            category: "Tidak lulus",
            action_type: RULE_ACTION_TYPES.REJECT,
            preference_score: null,
            rank: null,
            status: "rejected"
         }
      ],
      [
         { id: 1, name: "Citizen A" },
         { id: 2, name: "Citizen B" }
      ]
   )

   assert.equal(grouped.ranked_groups.length, 1)
   assert.equal(grouped.rejected_groups.length, 1)
   assert.equal(grouped.ranked_groups[0].items[0].alternative.name, "Citizen A")
   assert.equal(grouped.rejected_groups[0].items[0].alternative.name, "Citizen B")
})
