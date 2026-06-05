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

test("updateGradeRange rejects duplicate max_score within the same policy", async () => {
   const originalFindAll = ResultGradeRange.findAll
   ResultGradeRange.findAll = async () => ([
      { id: 1, max_score: 0.7 }
   ])

   try {
      await assert.rejects(
         () => gradeRangeService.updateGradeRange(
            { id: 2, result_grade_policy_id: 10, max_score: 0.5, update: async () => {} },
            { max_score: 0.7 }
         ),
         ValidationError
      )
   } finally {
      ResultGradeRange.findAll = originalFindAll
   }
})

test("updateGradeRange accepts adjacent thresholds that touch each other", async () => {
   const originalFindAll = ResultGradeRange.findAll
   ResultGradeRange.findAll = async () => ([
      { id: 1, max_score: 0.5 }
   ])

   let updated = null

   try {
      await gradeRangeService.updateGradeRange(
         { id: 2, result_grade_policy_id: 10, max_score: 0.4, update: async (values) => { updated = values } },
         { max_score: 1 }
      )
   } finally {
      ResultGradeRange.findAll = originalFindAll
   }

   assert.equal(updated.max_score, 1)
   assert.equal(updated.min_score, null)
})

test("resolveRangeGrade picks the tier whose threshold covers the score", () => {
   const ranges = [
      { code: RESULT_GRADE_CODES.HIGH_PRIORITY, label: "Prioritas tinggi", max_score: 1, result_status: "ranked" },
      { code: RESULT_GRADE_CODES.MEDIUM_PRIORITY, label: "Prioritas sedang", max_score: 0.65, result_status: "ranked" },
      { code: RESULT_GRADE_CODES.LOW_PRIORITY, label: "Prioritas rendah", max_score: 0.5, result_status: "ranked" },
      { code: RESULT_GRADE_CODES.NOT_ELIGIBLE, label: "Tidak memenuhi", max_score: 0.34, result_status: "rejected" }
   ]

   // 0.68 berada di antara 0.65 dan 1.0 -> masuk tier tinggi.
   assert.equal(gradingService.resolveRangeGrade(0.68, ranges).code, RESULT_GRADE_CODES.HIGH_PRIORITY)
   // 0.65 sebagai batas atas tier sedang (inclusive) -> tier sedang.
   assert.equal(gradingService.resolveRangeGrade(0.65, ranges).code, RESULT_GRADE_CODES.MEDIUM_PRIORITY)
   // 0.5 sebagai batas atas tier rendah -> tier rendah.
   assert.equal(gradingService.resolveRangeGrade(0.5, ranges).code, RESULT_GRADE_CODES.LOW_PRIORITY)
   // 0 sebagai batas bawah tier paling rendah -> tier paling bawah.
   assert.equal(gradingService.resolveRangeGrade(0, ranges).code, RESULT_GRADE_CODES.NOT_ELIGIBLE)
   // Skor di antara 0 dan threshold paling bawah -> tier paling bawah.
   assert.equal(gradingService.resolveRangeGrade(0.2, ranges).code, RESULT_GRADE_CODES.NOT_ELIGIBLE)
})
