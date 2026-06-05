const ResultGradeRange = require("../models/result-grade-range.model")
const ResultGradePolicy = require("../models/result-grade-policy.model")
const { NotFoundError, ValidationError } = require("../utils/appError")

const normalizeScore = (value, fallback) => (value ?? fallback)

const validateRangeOverlap = async ({ policyId, nextRange, currentId }) => {
   const ranges = await ResultGradeRange.findAll({
      where: { result_grade_policy_id: policyId },
      order: [["sort_order", "ASC"]]
   })

   const nextMin = normalizeScore(nextRange.min_score, 0)
   const nextMax = normalizeScore(nextRange.max_score, 1)

   for (const range of ranges) {
      if (currentId && range.id === currentId) {
         continue
      }

      const existingMin = normalizeScore(range.min_score, 0)
      const existingMax = normalizeScore(range.max_score, 1)
      // Overlap dianggap terjadi hanya jika kedua rentang benar-benar tumpang tindih
      // secara interior. Titik singgung (mis. existingMax == nextMin) dianggap sah
      // sebagai batas berdampingan supaya user bisa membentuk rentang menyambung
      // tanpa gap seperti 0.00-0.34, 0.35-0.49, 0.50-0.64, 0.65-1.00.
      const overlaps = nextMin < existingMax && nextMax > existingMin

      if (overlaps) {
         throw new ValidationError("Grade ranges must not overlap within the same policy")
      }
   }
}

const validateRange = ({ min_score, max_score }) => {
   if (min_score !== undefined && max_score !== undefined && min_score > max_score) {
      throw new ValidationError("min_score must be less than or equal to max_score")
   }
}

const createGradeRange = async (payload) => {
   const policy = await ResultGradePolicy.findByPk(payload.result_grade_policy_id)

   if (!policy) {
      throw new NotFoundError("Result grade policy not found")
   }

   validateRange(payload)
   await validateRangeOverlap({
      policyId: policy.id,
      nextRange: payload
   })

   return ResultGradeRange.create({
      ...payload,
      created_at: new Date()
   })
}

const updateGradeRange = async (range, payload) => {
   const nextRange = {
      min_score: payload.min_score ?? range.min_score,
      max_score: payload.max_score ?? range.max_score
   }

   validateRange(nextRange)

   await validateRangeOverlap({
      policyId: range.result_grade_policy_id,
      nextRange,
      currentId: range.id
   })

   await range.update(payload)
   return range
}

module.exports = {
   createGradeRange,
   updateGradeRange
}
