const Alternative = require("../models/alternative.model")
const RuleEvaluation = require("../models/rule-evaluation.model")
const RuleVariable = require("../models/rule-variable.model")
const { ConflictError, NotFoundError, ValidationError } = require("../utils/appError")
const { RULE_VARIABLE_TYPES } = require("../constants/rule-variable-types")

const getTypedPayload = ({ ruleVariable, value_boolean, value_number, value_string }) => {
   switch (ruleVariable.value_type) {
      case RULE_VARIABLE_TYPES.BOOLEAN:
         if (typeof value_boolean !== "boolean") {
            throw new ValidationError("value_boolean is required for boolean rule variables")
         }
         return {
            value_boolean,
            value_number: null,
            value_string: null
         }
      case RULE_VARIABLE_TYPES.NUMBER:
         if (typeof value_number !== "number" || !Number.isFinite(value_number)) {
            throw new ValidationError("value_number is required for numeric rule variables")
         }
         return {
            value_boolean: null,
            value_number,
            value_string: null
         }
      case RULE_VARIABLE_TYPES.STRING:
         if (typeof value_string !== "string" || !value_string.trim()) {
            throw new ValidationError("value_string is required for string rule variables")
         }
         return {
            value_boolean: null,
            value_number: null,
            value_string: value_string.trim()
         }
      default:
         throw new ValidationError("Unsupported rule variable type")
   }
}

const loadIntegrityContext = async ({ alternativeId, ruleVariableId }) => {
   const [alternative, ruleVariable] = await Promise.all([
      Alternative.findByPk(alternativeId),
      RuleVariable.findByPk(ruleVariableId)
   ])

   if (!alternative) {
      throw new NotFoundError("Alternative not found")
   }

   if (!ruleVariable) {
      throw new NotFoundError("Rule variable not found")
   }

   if (alternative.decision_model_id !== ruleVariable.decision_model_id) {
      throw new ValidationError("Alternative and rule variable must belong to the same decision model")
   }

   return { alternative, ruleVariable }
}

const assertUniqueEvaluation = async ({ alternativeId, ruleVariableId, currentId }) => {
   const existing = await RuleEvaluation.findOne({
      where: {
         alternative_id: alternativeId,
         rule_variable_id: ruleVariableId
      }
   })

   if (existing && existing.id !== currentId) {
      throw new ConflictError("A rule evaluation already exists for this alternative and rule variable")
   }
}

const createRuleEvaluation = async (payload) => {
   const { alternative, ruleVariable } = await loadIntegrityContext({
      alternativeId: payload.alternative_id,
      ruleVariableId: payload.rule_variable_id
   })

   await assertUniqueEvaluation({
      alternativeId: alternative.id,
      ruleVariableId: ruleVariable.id
   })

   const typedPayload = getTypedPayload({ ruleVariable, ...payload })

   return RuleEvaluation.create({
      alternative_id: alternative.id,
      rule_variable_id: ruleVariable.id,
      ...typedPayload,
      created_at: new Date()
   })
}

const updateRuleEvaluation = async (ruleEvaluation, payload) => {
   const ruleVariable = await RuleVariable.findByPk(ruleEvaluation.rule_variable_id)

   if (!ruleVariable) {
      throw new NotFoundError("Rule variable not found")
   }

   const typedPayload = getTypedPayload({ ruleVariable, ...payload })
   await ruleEvaluation.update(typedPayload)
   return ruleEvaluation
}

module.exports = {
   createRuleEvaluation,
   updateRuleEvaluation,
   getTypedPayload
}
