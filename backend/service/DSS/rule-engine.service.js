const Rule = require("../../models/rule.model")
const RuleCondition = require("../../models/rule-condition.model")
const Alternative = require("../../models/alternative.model")

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
            break
         }
      }

      results.push({
         alternative_id: alternative.id,
         category
       })

   }

   return results
}
