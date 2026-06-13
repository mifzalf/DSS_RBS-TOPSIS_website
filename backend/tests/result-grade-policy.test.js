const test = require("node:test")
const assert = require("node:assert/strict")

const gradePolicyService = require("../service/result-grade-policy.service")
const { ValidationError } = require("../utils/appError")
const gradeRangeService = require("../service/result-grade-range.service")
const ResultGradePolicy = require("../models/result-grade-policy.model")

test("updateGradeRange rejects max_score outside [0, 1]", async () => {
   await assert.rejects(
      () => gradeRangeService.updateGradeRange(
         { id: 1, result_grade_policy_id: 10, update: async () => {} },
         { max_score: 1.5 }
      ),
      ValidationError
   )

   await assert.rejects(
      () => gradeRangeService.updateGradeRange(
         { id: 1, result_grade_policy_id: 10, update: async () => {} },
         { max_score: -0.1 }
      ),
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
