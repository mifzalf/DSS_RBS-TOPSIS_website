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

const isRejectedGrade = (gradeCode) => gradeCode === RESULT_GRADE_CODES.NOT_ELIGIBLE

const resolveRangeGrade = (score, ranges) => {
   if (score === null || score === undefined) {
      return null
   }

   return ranges.find((range) => {
      const min = range.min_score ?? 0
      const max = range.max_score ?? 1
      return score >= min && score <= max
   }) || null
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
         const nextStatus = isRejectedGrade(matchedRange.code) ? "rejected" : result.status

         return {
            ...result,
            status: nextStatus,
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
   isRejectedGrade,
   resolveRangeGrade,
   loadPoliciesByCategory
}
