const ResultGradePolicy = require("../models/result-grade-policy.model")
const ResultGradeRange = require("../models/result-grade-range.model")
const { ConflictError, ValidationError } = require("../utils/appError")
const { RESULT_GRADE_CODES, RESULT_GRADE_LABELS } = require("../constants/result-grades")

const DEFAULT_RANKED_RANGES = [
   { code: RESULT_GRADE_CODES.HIGH_PRIORITY, label: RESULT_GRADE_LABELS[RESULT_GRADE_CODES.HIGH_PRIORITY], result_status: "ranked" },
   { code: RESULT_GRADE_CODES.MEDIUM_PRIORITY, label: RESULT_GRADE_LABELS[RESULT_GRADE_CODES.MEDIUM_PRIORITY], result_status: "ranked" },
   { code: RESULT_GRADE_CODES.LOW_PRIORITY, label: RESULT_GRADE_LABELS[RESULT_GRADE_CODES.LOW_PRIORITY], result_status: "ranked" },
   { code: RESULT_GRADE_CODES.NOT_ELIGIBLE, label: RESULT_GRADE_LABELS[RESULT_GRADE_CODES.NOT_ELIGIBLE], result_status: "rejected" },
]

const DEFAULT_REJECTED_RANGES = [
   { code: RESULT_GRADE_CODES.NOT_ELIGIBLE, label: RESULT_GRADE_LABELS[RESULT_GRADE_CODES.NOT_ELIGIBLE], result_status: "rejected" },
]

const assertPolicyUnique = async ({ decisionModelId, categoryId, appliesToStatus, currentId }) => {
   const policies = await ResultGradePolicy.findAll({
      where: { decision_model_id: decisionModelId }
   })

   for (const item of policies) {
      if (currentId && item.id === currentId) {
         continue
      }

      if (item.category_id === categoryId && item.applies_to_status === appliesToStatus) {
         throw new ConflictError("Result grade policy already exists for this category and status")
      }
   }
}

const createGradePolicy = async (payload) => {
   await assertPolicyUnique({
      decisionModelId: payload.decision_model_id,
      categoryId: payload.category_id,
      appliesToStatus: payload.applies_to_status
   })

   const policy = await ResultGradePolicy.create({
      ...payload,
      created_at: new Date()
   })

   const ranges = payload.applies_to_status === "ranked" ? DEFAULT_RANKED_RANGES : DEFAULT_REJECTED_RANGES

   await ResultGradeRange.bulkCreate(
      ranges.map((range, index) => ({
         result_grade_policy_id: policy.id,
         label: range.label,
         code: range.code,
         min_score: null,
         max_score: null,
         sort_order: index + 1,
         result_status: range.result_status,
         created_at: new Date()
      }))
   )

   return policy
}

const updateGradePolicy = async (policy, payload) => {
   const nextStatus = payload.applies_to_status ?? policy.applies_to_status

   if (nextStatus === "rejected") {
      const ranges = await ResultGradeRange.findAll({
         where: { result_grade_policy_id: policy.id }
      })

      if (ranges.length > 1) {
         throw new ValidationError("Rejected grade policies may only contain one range")
      }
   }

   await assertPolicyUnique({
      decisionModelId: policy.decision_model_id,
      categoryId: payload.category_id ?? policy.category_id,
      appliesToStatus: nextStatus,
      currentId: policy.id
   })

   await policy.update(payload)
   return policy
}

module.exports = {
   createGradePolicy,
   updateGradePolicy
}
