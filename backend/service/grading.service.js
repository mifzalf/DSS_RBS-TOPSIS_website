const ResultGradePolicy = require("../models/result-grade-policy.model")
const ResultGradeRange = require("../models/result-grade-range.model")
const { RESULT_GRADE_CODES, RESULT_GRADE_LABELS } = require("../constants/result-grades")

const loadPoliciesByCategory = async (decisionModelId) => {
   const policies = await ResultGradePolicy.findAll({
      where: { decision_model_id: decisionModelId },
      include: [
         {
            association: "ranges"
         },
         {
            association: "categoryRef",
            attributes: ["id", "code", "name", "is_ranked"]
         }
      ],
      order: [[{ model: ResultGradeRange, as: "ranges" }, "sort_order", "ASC"]]
   })

   return policies.reduce((map, item) => {
      const key = `${item.category_id}:${item.applies_to_status}`
      map.set(key, item)
      return map
   }, new Map())
}

const getRejectedGrade = () => ({
   grade_code: RESULT_GRADE_CODES.NOT_ELIGIBLE,
   grade_label: RESULT_GRADE_LABELS[RESULT_GRADE_CODES.NOT_ELIGIBLE]
})

// Resolusi grade dengan mekanisme "threshold turun":
// - Range diurutkan menurun berdasarkan max_score.
// - Score yang lebih besar dari max_score range berikutnya (yang lebih rendah)
//   masuk ke range saat ini. Range paling atas mencakup hingga 1.0, range
//   paling bawah mencakup mulai 0.
// - Range yang max_score-nya null dilewati saat penentuan batas, sehingga
//   policy yang belum dikonfigurasi tidak menggagalkan keseluruhan resolusi.
const resolveRangeGrade = (score, ranges) => {
   if (score === null || score === undefined) {
      return null
   }

   if (!Array.isArray(ranges) || ranges.length === 0) {
      return null
   }

   const configuredRanges = ranges.filter((range) => range.max_score !== null && range.max_score !== undefined)

   if (configuredRanges.length === 0) {
      return null
   }

   const sorted = [...configuredRanges].sort((a, b) => Number(b.max_score) - Number(a.max_score))

   for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index]
      const currentMax = Number(current.max_score)
      const nextRange = sorted[index + 1]
      const lowerBound = nextRange ? Number(nextRange.max_score) : 0
      const isLastTier = !nextRange

      if (score <= currentMax && (isLastTier ? score >= lowerBound : score > lowerBound)) {
         return current
      }
   }

   return null
}

const applyGrades = async ({ decisionModelId, results, policiesByCategory }) => {
   const resolvedPolicies = policiesByCategory || await loadPoliciesByCategory(decisionModelId)

   return results.map((result) => {
      if (result.status === "rejected") {
         const rejectedPolicy = resolvedPolicies.get(`${result.category_id}:rejected`)
         const rejectedRange = rejectedPolicy?.ranges?.[0]

         if (rejectedRange) {
            return {
               ...result,
               grade_code: rejectedRange.code,
               grade_label: rejectedRange.label
            }
         }

         return {
            ...result,
            ...getRejectedGrade()
         }
      }

      const rankedPolicy = resolvedPolicies.get(`${result.category_id}:ranked`)
      const matchedRange = resolveRangeGrade(result.preference_score, rankedPolicy?.ranges || [])

      if (matchedRange) {
          return {
             ...result,
             status: matchedRange.result_status,
             grade_code: matchedRange.code,
             grade_label: matchedRange.label
          }
       }

      return {
         ...result,
         grade_code: RESULT_GRADE_CODES.LOW_PRIORITY,
         grade_label: RESULT_GRADE_LABELS[RESULT_GRADE_CODES.LOW_PRIORITY]
      }
   })
}

module.exports = {
   applyGrades,
   getRejectedGrade,
   resolveRangeGrade,
   loadPoliciesByCategory
}
