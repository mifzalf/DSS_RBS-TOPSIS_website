const Rule = require("../../models/rule.model")
const RuleCondition = require("../../models/rule-condition.model")
const Alternative = require("../../models/alternative.model")
const { DEFAULT_REJECTED_CATEGORY, RULE_ACTION_TYPES } = require("../../constants/rule-actions")

const NON_RANKED_ACTIONS = new Set([RULE_ACTION_TYPES.REJECT, "disqualify", "not_eligible"])
const NON_RANKED_CATEGORY_KEYWORDS = ["tidak lulus", "not eligible", "rejected", "reject"]

const evaluateCondition = (fieldValue, operator, conditionValue) => {
   switch (operator) {
      case "=":
         return fieldValue == conditionValue
      case ">":
         return Number(fieldValue) > Number(conditionValue)
      case "<":
         return Number(fieldValue) < Number(conditionValue)
      case ">=":
         return Number(fieldValue) >= Number(conditionValue)
      case "<=":
         return Number(fieldValue) <= Number(conditionValue)
      default:
         return false
   }
}

const matchesRule = (rule, evaluations) => {
   if (!evaluations.length) {
      return false
   }

   if (rule.logic_type === "OR") {
      return evaluations.some(Boolean)
   }

   return evaluations.every(Boolean)
}

const normalizeActionType = (actionType) => String(actionType || RULE_ACTION_TYPES.ASSIGN_BENEFIT).trim().toLowerCase()

const isRankedCategory = ({ actionType, category }) => {
   if (NON_RANKED_ACTIONS.has(normalizeActionType(actionType))) {
      return false
   }

   const normalizedCategory = String(category || "").trim().toLowerCase()
   return !NON_RANKED_CATEGORY_KEYWORDS.some(keyword => normalizedCategory.includes(keyword))
}

exports.runRuleEngine = async (decisionModelId) => {
   const alternatives = await Alternative.findAll({
      where: { decision_model_id: decisionModelId },
      order: [["id", "ASC"]]
   })

   const rules = await Rule.findAll({
      where: {
         decision_model_id: decisionModelId,
         status_active: true
       },
       include: [
         {
            association: "conditions"
         }
       ],
       order: [["priority", "ASC"], [{ model: RuleCondition, as: "conditions" }, "id", "ASC"]]
    })

   const results = []

   for (const alternative of alternatives) {
      let category = null
      let actionType = RULE_ACTION_TYPES.REJECT
      let isRanked = false

      for (const rule of rules) {
         const conditions = rule.conditions || []

         const evaluations = conditions.map(condition => {
            const fieldValue = alternative[condition.field]

            return evaluateCondition(
               fieldValue,
               condition.operator,
               condition.value
            )

         })

         if (matchesRule(rule, evaluations)) {
            category = rule.target_category
            actionType = normalizeActionType(rule.action_type)
            isRanked = isRankedCategory({ actionType, category })
            break
         }
      }

      if (!category) {
         category = DEFAULT_REJECTED_CATEGORY
      }

      results.push({
         alternative_id: alternative.id,
         category,
         action_type: actionType,
         is_ranked: isRanked
        })

   }

   return results
}

module.exports.NON_RANKED_ACTIONS = NON_RANKED_ACTIONS
module.exports.isRankedCategory = isRankedCategory
module.exports.normalizeActionType = normalizeActionType
module.exports.DEFAULT_REJECTED_CATEGORY = DEFAULT_REJECTED_CATEGORY
