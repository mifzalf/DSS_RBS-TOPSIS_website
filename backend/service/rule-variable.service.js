const RuleVariable = require("../models/rule-variable.model")
const { ConflictError } = require("../utils/appError")

const assertRuleVariableUnique = async ({ decisionModelId, code, name, currentId }) => {
   const existing = await RuleVariable.findAll({
      where: { decision_model_id: decisionModelId }
   })

   for (const item of existing) {
      if (currentId && item.id === currentId) {
         continue
      }

      if (item.code === code) {
         throw new ConflictError("Rule variable code already exists in this decision model")
      }

      if (item.name === name) {
         throw new ConflictError("Rule variable name already exists in this decision model")
      }
   }
}

const createRuleVariable = async (payload) => {
   await assertRuleVariableUnique({
      decisionModelId: payload.decision_model_id,
      code: payload.code,
      name: payload.name
   })

   return RuleVariable.create({
      ...payload,
      status_active: payload.status_active ?? true,
      created_at: new Date()
   })
}

const updateRuleVariable = async (ruleVariable, payload) => {
   await assertRuleVariableUnique({
      decisionModelId: ruleVariable.decision_model_id,
      code: payload.code ?? ruleVariable.code,
      name: payload.name ?? ruleVariable.name,
      currentId: ruleVariable.id
   })

   await ruleVariable.update(payload)
   return ruleVariable
}

module.exports = {
   createRuleVariable,
   updateRuleVariable
}
