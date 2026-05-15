const AssistanceCategory = require("../models/assistance-category.model")
const { ConflictError } = require("../utils/appError")

const normalizeSlotCount = ({ isRanked, slotCount, currentSlotCount = null }) => {
   if (!isRanked) {
      return null
   }

   if (slotCount === undefined) {
      return currentSlotCount
   }

   if (slotCount === null || slotCount === "") {
      return null
   }

   const parsed = Number(slotCount)
   return Number.isFinite(parsed) ? parsed : null
}

const normalizeNullablePositiveInteger = (value, currentValue = null) => {
   if (value === undefined) return currentValue
   if (value === null || value === "") return null
   const parsed = Number(value)
   return Number.isFinite(parsed) ? parsed : null
}

const normalizeCategoryPayload = (payload, currentCategory = null) => {
   const isRanked = payload.is_ranked !== undefined
      ? payload.is_ranked
      : currentCategory?.is_ranked ?? true

   return {
      ...payload,
      slot_count: normalizeSlotCount({
         isRanked,
         slotCount: payload.slot_count,
         currentSlotCount: currentCategory?.slot_count ?? null
      }),
      allocation_order: !isRanked
         ? null
         : normalizeNullablePositiveInteger(payload.allocation_order, currentCategory?.allocation_order ?? null),
      accepts_overflow: !isRanked
         ? false
         : (payload.accepts_overflow ?? currentCategory?.accepts_overflow ?? false)
   }
}

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
   const normalizedPayload = normalizeCategoryPayload(payload)

   await assertCategoryUnique({
      decisionModelId: normalizedPayload.decision_model_id,
      code: normalizedPayload.code,
      name: normalizedPayload.name
   })

   return AssistanceCategory.create({
      ...normalizedPayload,
      is_ranked: normalizedPayload.is_ranked ?? true,
      status_active: normalizedPayload.status_active ?? true,
      created_at: new Date()
   })
}

const updateCategory = async (category, payload) => {
   const normalizedPayload = normalizeCategoryPayload(payload, category)

   await assertCategoryUnique({
      decisionModelId: category.decision_model_id,
      code: normalizedPayload.code ?? category.code,
      name: normalizedPayload.name ?? category.name,
      currentId: category.id
   })

   await category.update(normalizedPayload)
   return category
}

module.exports = {
   createCategory,
   updateCategory,
   normalizeCategoryPayload,
   normalizeSlotCount
}
