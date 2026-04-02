const AssistanceCategory = require("../models/assistance-category.model")
const { ConflictError } = require("../utils/appError")

const assertCategoryUnique = async ({ decisionModelId, code, name, currentId }) => {
   const items = await AssistanceCategory.findAll({
      where: { decision_model_id: decisionModelId }
   })

   for (const item of items) {
      if (currentId && item.id === currentId) {
         continue
      }

      if (item.code === code) {
         throw new ConflictError("Assistance category code already exists in this decision model")
      }

      if (item.name === name) {
         throw new ConflictError("Assistance category name already exists in this decision model")
      }
   }
}

const createCategory = async (payload) => {
   await assertCategoryUnique({
      decisionModelId: payload.decision_model_id,
      code: payload.code,
      name: payload.name
   })

   return AssistanceCategory.create({
      ...payload,
      is_ranked: payload.is_ranked ?? true,
      status_active: payload.status_active ?? true,
      created_at: new Date()
   })
}

const updateCategory = async (category, payload) => {
   await assertCategoryUnique({
      decisionModelId: category.decision_model_id,
      code: payload.code ?? category.code,
      name: payload.name ?? category.name,
      currentId: category.id
   })

   await category.update(payload)
   return category
}

module.exports = {
   createCategory,
   updateCategory
}
