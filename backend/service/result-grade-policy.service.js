const ResultGradePolicy = require("../models/result-grade-policy.model")
const ResultGradeRange = require("../models/result-grade-range.model")
const { ConflictError, ValidationError } = require("../utils/appError")

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

   return ResultGradePolicy.create({
      ...payload,
      created_at: new Date()
   })
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
