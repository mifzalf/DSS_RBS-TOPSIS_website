const test = require("node:test")
const assert = require("node:assert/strict")

const gradePolicyService = require("../service/result-grade-policy.service")
const { ValidationError } = require("../utils/appError")
const gradeRangeService = require("../service/result-grade-range.service")
const ResultGradePolicy = require("../models/result-grade-policy.model")

test("updateGradeRange rejects invalid min/max score combinations", async () => {
   await assert.rejects(
      () => gradeRangeService.updateGradeRange({ update: async () => {}, min_score: 0.2, max_score: 0.4 }, { min_score: 0.8, max_score: 0.3 }),
      ValidationError
   )
})

test("updateGradePolicy keeps existing category and status when payload is partial", async () => {
   const originalFindAll = ResultGradePolicy.findAll
   ResultGradePolicy.findAll = async () => ([{ id: 10, category: "PKH", applies_to_status: "ranked" }])

   const policy = {
      id: 10,
      decision_model_id: 1,
      category: "PKH",
      applies_to_status: "ranked",
      update: async function update(payload) {
         Object.assign(this, payload)
      }
   }

   try {
      const updated = await gradePolicyService.updateGradePolicy(policy, { category_id: 11 })
      assert.equal(updated.category_id, 11)
      assert.equal(updated.applies_to_status, "ranked")
   } finally {
      ResultGradePolicy.findAll = originalFindAll
   }
})
