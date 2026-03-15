const Rule = require("../models/rules")
const RuleCondition = require("../models/ruleConditions")
const Alternative = require("../models/alternatives")

const evaluateCondition = (fieldValue, operator, conditionValue) => {

   switch(operator){

      case "=":
         return fieldValue == conditionValue

      case ">":
         return fieldValue > conditionValue

      case "<":
         return fieldValue < conditionValue

      case ">=":
         return fieldValue >= conditionValue

      case "<=":
         return fieldValue <= conditionValue

      default:
         return false
   }

}

exports.runRuleEngine = async (decisionModelId)=>{

   const alternatives = await Alternative.findAll({
      where:{ decision_model_id:decisionModelId }
   })

   const rules = await Rule.findAll({
      where:{
         decision_model_id:decisionModelId,
         status_active:true
      },
      order:[["priority","ASC"]]
   })

   const results = []

   for(const alternative of alternatives){

      let category = null

      for(const rule of rules){

         const conditions = await RuleCondition.findAll({
            where:{ rule_id:rule.id }
         })

         let match = true

         for(const condition of conditions){

            const fieldValue = alternative[condition.field]

            const valid = evaluateCondition(
               fieldValue,
               condition.operator,
               condition.value
            )

            if(!valid){
               match = false
               break
            }

         }

         if(match){

            category = rule.target_category
            break

         }

      }

      results.push({
         alternative_id:alternative.id,
         category:category
      })

   }

   return results
}