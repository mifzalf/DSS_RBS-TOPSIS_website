const test = require("node:test")
const assert = require("node:assert/strict")

const gradingService = require("../service/grading.service")
const { RESULT_GRADE_CODES } = require("../constants/result-grades")
const gradeRangeService = require("../service/result-grade-range.service")
const ResultGradeRange = require("../models/result-grade-range.model")
const ResultGradePolicy = require("../models/result-grade-policy.model")
const { ValidationError } = require("../utils/appError")

test("applyGrades maps ranked scores using category policy", async () => {
   const policiesByCategory = new Map([
      [
         "1:ranked",
         {
            ranges: [
               { code: RESULT_GRADE_CODES.HIGH_PRIORITY, label: "High priority", min_score: 0.7, max_score: 1 },
               { code: RESULT_GRADE_CODES.MEDIUM_PRIORITY, label: "Medium priority", min_score: 0.4, max_score: 0.6999 },
               { code: RESULT_GRADE_CODES.LOW_PRIORITY, label: "Low priority", min_score: 0, max_score: 0.3999 }
            ]
         }
      ]
   ])

   const graded = await gradingService.applyGrades({
      decisionModelId: 1,
      policiesByCategory,
      results: [
         { category_id: 1, category: "PKH", preference_score: 0.82, rank: 1, status: "ranked" },
         { category_id: 1, category: "PKH", preference_score: 0.55, rank: 2, status: "ranked" },
         { category_id: 1, category: "PKH", preference_score: 0.12, rank: 3, status: "ranked" }
      ]
   })

   assert.deepEqual(graded.map(item => item.grade_code), [
      RESULT_GRADE_CODES.HIGH_PRIORITY,
      RESULT_GRADE_CODES.MEDIUM_PRIORITY,
      RESULT_GRADE_CODES.LOW_PRIORITY
   ])
})

test("applyGrades can downgrade ranked results to not eligible from configured range", async () => {
   const policiesByCategory = new Map([
      [
         "1:ranked",
         {
            ranges: [
               { code: RESULT_GRADE_CODES.HIGH_PRIORITY, label: "High priority", min_score: 0.7, max_score: 1 },
               { code: RESULT_GRADE_CODES.MEDIUM_PRIORITY, label: "Medium priority", min_score: 0.4, max_score: 0.6999 },
               { code: RESULT_GRADE_CODES.LOW_PRIORITY, label: "Low priority", min_score: 0.2, max_score: 0.3999 },
               { code: RESULT_GRADE_CODES.NOT_ELIGIBLE, label: "Not eligible", min_score: 0, max_score: 0.1999 }
            ]
         }
      ]
   ])

   const graded = await gradingService.applyGrades({
      decisionModelId: 1,
      policiesByCategory,
      results: [
         { category_id: 1, category: "PKH", preference_score: 0.11, rank: 4, status: "ranked" }
      ]
   })

   assert.equal(graded[0].grade_code, RESULT_GRADE_CODES.NOT_ELIGIBLE)
   assert.equal(graded[0].grade_label, "Not eligible")
   assert.equal(graded[0].status, "rejected")
})

test("updateGradeRange rejects overlapping score ranges within the same policy", async () => {
   const originalFindAll = ResultGradeRange.findAll
   ResultGradeRange.findAll = async () => ([
      { id: 1, min_score: 0.4, max_score: 0.7 }
   ])

   try {
      await assert.rejects(
         () => gradeRangeService.updateGradeRange({ id: 2, result_grade_policy_id: 10, min_score: 0.2, max_score: 0.39, update: async () => {} }, { min_score: 0.35, max_score: 0.5 }),
         ValidationError
      )
   } finally {
      ResultGradeRange.findAll = originalFindAll
   }
})

test("createGradeRange rejects multiple ranges for rejected policies", async () => {
   const originalFindByPk = ResultGradePolicy.findByPk
   const originalFindAll = ResultGradeRange.findAll

   ResultGradePolicy.findByPk = async () => ({ id: 7, applies_to_status: "rejected" })
   ResultGradeRange.findAll = async () => ([{ id: 1 }])

   try {
      await assert.rejects(
         () => gradeRangeService.createGradeRange({ result_grade_policy_id: 7, label: "Another", code: "another", min_score: 0, max_score: 1, sort_order: 2 }),
         ValidationError
      )
   } finally {
      ResultGradePolicy.findByPk = originalFindByPk
      ResultGradeRange.findAll = originalFindAll
   }
})

test("resolveRangeGrade returns matching score bucket", () => {
   const range = gradingService.resolveRangeGrade(0.68, [
      { code: RESULT_GRADE_CODES.HIGH_PRIORITY, label: "High priority", min_score: 0.7, max_score: 1 },
      { code: RESULT_GRADE_CODES.MEDIUM_PRIORITY, label: "Medium priority", min_score: 0.4, max_score: 0.6999 }
   ])

   assert.equal(range.code, RESULT_GRADE_CODES.MEDIUM_PRIORITY)
})
