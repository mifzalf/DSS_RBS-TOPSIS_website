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
               { code: RESULT_GRADE_CODES.HIGH_PRIORITY, label: "Prioritas tinggi", min_score: 0.7, max_score: 1, result_status: "ranked" },
               { code: RESULT_GRADE_CODES.MEDIUM_PRIORITY, label: "Prioritas sedang", min_score: 0.4, max_score: 0.6999, result_status: "ranked" },
               { code: RESULT_GRADE_CODES.LOW_PRIORITY, label: "Prioritas rendah", min_score: 0, max_score: 0.3999, result_status: "ranked" }
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
               { code: RESULT_GRADE_CODES.HIGH_PRIORITY, label: "Prioritas tinggi", min_score: 0.7, max_score: 1, result_status: "ranked" },
               { code: RESULT_GRADE_CODES.MEDIUM_PRIORITY, label: "Prioritas sedang", min_score: 0.4, max_score: 0.6999, result_status: "ranked" },
               { code: RESULT_GRADE_CODES.LOW_PRIORITY, label: "Prioritas rendah", min_score: 0.2, max_score: 0.3999, result_status: "ranked" },
               { code: RESULT_GRADE_CODES.NOT_ELIGIBLE, label: "Tidak memenuhi syarat", min_score: 0, max_score: 0.1999, result_status: "rejected" }
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
   assert.equal(graded[0].grade_label, "Tidak memenuhi syarat")
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

test("resolveRangeGrade returns matching score bucket", () => {
   const range = gradingService.resolveRangeGrade(0.68, [
      { code: RESULT_GRADE_CODES.HIGH_PRIORITY, label: "Prioritas tinggi", min_score: 0.7, max_score: 1, result_status: "ranked" },
      { code: RESULT_GRADE_CODES.MEDIUM_PRIORITY, label: "Prioritas sedang", min_score: 0.4, max_score: 0.6999, result_status: "ranked" }
   ])

   assert.equal(range.code, RESULT_GRADE_CODES.MEDIUM_PRIORITY)
})
