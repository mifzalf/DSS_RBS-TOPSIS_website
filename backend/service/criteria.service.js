const Criteria = require("../models/criteria.model")
const { ConflictError, ValidationError } = require("../utils/appError")

const assertTotalWeight = async ({ decisionModelId, nextWeight, currentCriteriaId }) => {
   const existingCriteria = await Criteria.findAll({
      where: { decision_model_id: decisionModelId }
   })

   const totalWeight = existingCriteria.reduce((sum, item) => {
      if (currentCriteriaId && item.id === currentCriteriaId) {
         return sum
      }

      return sum + Number(item.weight || 0)
   }, 0)

   if (totalWeight + Number(nextWeight) > 1) {
      throw new ValidationError("Total weight must not exceed 1")
   }
}

const assertCriteriaCodeUnique = async ({ decisionModelId, code, currentCriteriaId }) => {
   if (!code) {
      return
   }

   const existing = await Criteria.findOne({
      where: {
         decision_model_id: decisionModelId,
         code
      }
   })

   if (existing && existing.id !== currentCriteriaId) {
      throw new ConflictError("Criteria code already exists in this decision model")
   }
}

const createCriteria = async (payload) => {
   await assertTotalWeight({
      decisionModelId: payload.decision_model_id,
      nextWeight: payload.weight
   })

   await assertCriteriaCodeUnique({
      decisionModelId: payload.decision_model_id,
      code: payload.code
   })

   return Criteria.create({
      ...payload,
      status_active: true,
      created_at: new Date()
   })
}

const updateCriteria = async (criteria, payload) => {
   if (payload.weight !== undefined) {
      await assertTotalWeight({
         decisionModelId: criteria.decision_model_id,
         nextWeight: payload.weight,
         currentCriteriaId: criteria.id
      })
   }

   if (payload.code !== undefined) {
      await assertCriteriaCodeUnique({
         decisionModelId: criteria.decision_model_id,
         code: payload.code,
         currentCriteriaId: criteria.id
      })
   }

   await criteria.update(payload)
   return criteria
}

module.exports = {
   createCriteria,
   updateCriteria
}
