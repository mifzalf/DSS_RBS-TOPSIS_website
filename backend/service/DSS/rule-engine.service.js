const Rule = require("../../models/rule.model")
const RuleCondition = require("../../models/rule-condition.model")
const Alternative = require("../../models/alternative.model")
const RuleEvaluation = require("../../models/rule-evaluation.model")
const RuleVariable = require("../../models/rule-variable.model")
const AssistanceCategory = require("../../models/assistance-category.model")
const { DEFAULT_REJECTED_CATEGORY, RULE_ACTION_TYPES } = require("../../constants/rule-actions")
const { RULE_VARIABLE_TYPES } = require("../../constants/rule-variable-types")

const NON_RANKED_ACTIONS = new Set([RULE_ACTION_TYPES.REJECT, "disqualify", "not_eligible"])
const NON_RANKED_CATEGORY_KEYWORDS = ["tidak lulus", "tidak memenuhi syarat", "rejected", "reject"]

const normalizeConditionValue = (fieldValue, conditionValue) => {
   if (typeof fieldValue === "boolean") {
      if (typeof conditionValue === "string") {
         const normalized = conditionValue.trim().toLowerCase()

         if (normalized === "true" || normalized === "1") {
            return true
         }

         if (normalized === "false" || normalized === "0") {
            return false
         }
      }

      return Boolean(conditionValue)
   }

   return conditionValue
}

const evaluateCondition = (fieldValue, operator, conditionValue) => {
   const comparableValue = normalizeConditionValue(fieldValue, conditionValue)

   switch (operator) {
      case "=":
         return fieldValue == comparableValue
      case ">":
         return Number(fieldValue) > Number(comparableValue)
      case "<":
         return Number(fieldValue) < Number(comparableValue)
      case ">=":
         return Number(fieldValue) >= Number(comparableValue)
      case "<=":
         return Number(fieldValue) <= Number(comparableValue)
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

   if (rule.logic_type === "AT_LEAST_N") {
      const need = Number(rule.min_match_count) || 1
      const matched = evaluations.reduce((sum, value) => (value ? sum + 1 : sum), 0)
      return matched >= need
   }

   return evaluations.every(Boolean)
}

const normalizeActionType = (actionType) => String(actionType || RULE_ACTION_TYPES.ASSIGN_BENEFIT).trim().toLowerCase()

const getRuleEvaluationValue = (ruleEvaluation) => {
   if (!ruleEvaluation?.ruleVariable) {
      return undefined
   }

   switch (ruleEvaluation.ruleVariable.value_type) {
      case RULE_VARIABLE_TYPES.BOOLEAN:
         return ruleEvaluation.value_boolean
      case RULE_VARIABLE_TYPES.NUMBER:
         return ruleEvaluation.value_number
      case RULE_VARIABLE_TYPES.STRING:
         return ruleEvaluation.value_string
      default:
         return undefined
   }
}

const buildRuleFactMap = (ruleEvaluations) => {
   const factMap = new Map()

   for (const item of ruleEvaluations) {
      const code = item.ruleVariable?.code

      if (!code) {
         continue
      }

      factMap.set(code, getRuleEvaluationValue(item))
   }

   return factMap
}

const isTruthy = (value) => {
   if (value === undefined || value === null || value === false) {
      return false
   }

   if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      return normalized !== "false" && normalized !== "0" && normalized !== ""
   }

   if (typeof value === "number") {
      return value !== 0
   }

   return true
}

const isAllFactsEmpty = ({ factMap, activeVariableCodes }) => {
    if (!activeVariableCodes.length) {
       return false
    }
 
    return activeVariableCodes.every((code) => {
       const value = factMap.get(code)
       return !isTruthy(value)
    })
 }
 
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

    const [rules, fallbackCategories, activeRuleVariables] = await Promise.all([
        Rule.findAll({
       where: {
          decision_model_id: decisionModelId,
          status_active: true
        },
         include: [
          {
             association: "conditions",
             include: [
                {
                   association: "ruleVariable",
                   attributes: ["id", "code", "value_type"]
                }
             ]
          },
          {
             association: "categoryRef",
             attributes: ["id", "code", "name", "is_ranked", "slot_count", "allocation_order", "accepts_overflow"]
            }
         ],
        order: [["priority", "ASC"], [{ model: RuleCondition, as: "conditions" }, "id", "ASC"]]
     }),
        AssistanceCategory.findAll({
           where: {
              decision_model_id: decisionModelId,
              is_ranked: false,
              status_active: true
           },
           order: [["id", "ASC"]]
        }),
       RuleVariable.findAll({
          where: {
             decision_model_id: decisionModelId,
             status_active: true
          },
          attributes: ["code"]
       })
    ])
 
    const activeVariableCodes = activeRuleVariables.map(item => item.code)

    const fallbackCategory = fallbackCategories.find((category) => category.code === "not_eligible")
       || fallbackCategories[0]

    const results = []

   const alternativeIds = alternatives.map(item => item.id)
   const ruleEvaluations = alternativeIds.length
      ? await RuleEvaluation.findAll({
         where: { alternative_id: alternativeIds },
         include: [
            {
               association: "ruleVariable",
               attributes: ["id", "code", "value_type"]
            }
         ]
      })
      : []

   const factMaps = new Map()

   for (const alternative of alternatives) {
      const facts = ruleEvaluations.filter(item => item.alternative_id === alternative.id)
      factMaps.set(alternative.id, buildRuleFactMap(facts))
   }

   const doesRuleMatch = ({ rule, alternative, factMap, alreadyMatched }) => {
      // EMPTY = catch-all/default rule. Match kalau alternatif belum cocok dengan
      // rule berbobot (priority lebih tinggi) mana pun. Ini menangkap alternatif
      // yang "tidak punya rule sendiri", baik karena tidak punya variabel sama
      // sekali maupun karena variabelnya tidak cukup untuk memenuhi rule lain.
      if (rule.logic_type === "EMPTY") {
         return !alreadyMatched
      }

      const conditions = rule.conditions || []

      const evaluations = conditions.map(condition => {
         const fieldValue = condition.ruleVariable?.code
            ? factMap.get(condition.ruleVariable.code)
            : alternative[condition.field]

         return evaluateCondition(
            fieldValue,
            condition.operator,
            condition.value
         )
      })

      return matchesRule(rule, evaluations)
   }

   for (const alternative of alternatives) {
      let category = null
      let categoryId = null
      let actionType = RULE_ACTION_TYPES.REJECT
      let isRanked = false
      let slotCount = null
      let allocationOrder = null
      let acceptsOverflow = false
      const eligibleCategoryIds = []
      const factMap = factMaps.get(alternative.id) || new Map()

       for (const rule of rules) {
          const matched = doesRuleMatch({ rule, alternative, factMap, alreadyMatched: Boolean(category) })
          const ruleCategoryName = rule.categoryRef?.name || null
          const ruleActionType = normalizeActionType(rule.action_type)
          const ruleIsRanked = isRankedCategory({ actionType: ruleActionType, category: ruleCategoryName })

          if (matched && rule.categoryRef?.id && ruleIsRanked) {
             eligibleCategoryIds.push(rule.categoryRef.id)
          }

          if (matched && !category) {
             category = rule.categoryRef?.name || null
             categoryId = rule.categoryRef?.id || null
             actionType = ruleActionType
             isRanked = ruleIsRanked
             slotCount = rule.categoryRef?.slot_count ?? null
             allocationOrder = rule.categoryRef?.allocation_order ?? null
             acceptsOverflow = Boolean(rule.categoryRef?.accepts_overflow)
          }
       }

      if (!category) {
         category = fallbackCategory?.name || DEFAULT_REJECTED_CATEGORY
         categoryId = fallbackCategory?.id || null
      }

      results.push({
         alternative_id: alternative.id,
         category_id: categoryId,
         category,
         action_type: actionType,
         is_ranked: isRanked,
         slot_count: slotCount,
         allocation_order: allocationOrder,
         accepts_overflow: acceptsOverflow,
         eligible_category_ids: Array.from(new Set(eligibleCategoryIds))
         })

   }

   return results
}

module.exports.NON_RANKED_ACTIONS = NON_RANKED_ACTIONS
module.exports.isAllFactsEmpty = isAllFactsEmpty
module.exports.isRankedCategory = isRankedCategory
module.exports.normalizeActionType = normalizeActionType
module.exports.DEFAULT_REJECTED_CATEGORY = DEFAULT_REJECTED_CATEGORY
module.exports.getRuleEvaluationValue = getRuleEvaluationValue
module.exports.isTruthy = isTruthy
