const { db } = require("../config/database")
const DecisionModel = require("../models/decision-model.model")
const DecisionModelUser = require("../models/decision-model-user.model")
const AssistanceCategory = require("../models/assistance-category.model")
const Criteria = require("../models/criteria.model")
const Alternative = require("../models/alternative.model")
const RuleVariable = require("../models/rule-variable.model")
const Rule = require("../models/rule.model")
const Evaluation = require("../models/evaluation.model")
const RuleEvaluation = require("../models/rule-evaluation.model")
const Result = require("../models/result.model")
const ResultGradePolicy = require("../models/result-grade-policy.model")
const { ROLES } = require("./authorization.service")
const { ValidationError } = require("../utils/appError")

const WEIGHT_TOLERANCE = 0.0001

const toProgress = (checks) => {
   const normalizedChecks = checks.filter((check) => check !== null)
   const total = normalizedChecks.length || 1
   const completed = normalizedChecks.filter(Boolean).length
   return Math.round((completed / total) * 100)
}

const buildReadinessSummary = ({
   categoriesCount,
   criteria,
   alternativesCount,
   ruleVariablesCount,
   rulesCount,
   evaluationCount,
   ruleEvaluationCount,
   recommendationCount,
   gradePolicies
}) => {
   const totalWeight = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0)
   const hasBalancedWeights = criteria.length > 0 && Math.abs(totalWeight - 1) <= WEIGHT_TOLERANCE
   const expectedEvaluationCells = alternativesCount * criteria.length
   const expectedRuleEvaluations = alternativesCount * ruleVariablesCount
   const hasCategories = categoriesCount > 0
   const hasGradePolicies = gradePolicies.length > 0
   const hasValidGradeRanges = gradePolicies.length > 0 && gradePolicies.every((policy) => (policy.ranges?.length || 0) > 0)
   const hasCriteria = criteria.length > 0
   const hasRuleVariables = ruleVariablesCount > 0
   const hasRules = rulesCount > 0
   const hasAlternatives = alternativesCount > 0
   const hasCompleteTopsisEvaluations = alternativesCount > 0 && expectedEvaluationCells > 0 && evaluationCount >= expectedEvaluationCells
   const hasRuleEvaluations = alternativesCount > 0 && ruleVariablesCount > 0 && ruleEvaluationCount >= expectedRuleEvaluations
   const hasRecommendations = recommendationCount > 0

   const generalChecks = [hasCategories, hasGradePolicies, hasValidGradeRanges, hasRecommendations]
   const topsisChecks = [hasCriteria, hasBalancedWeights]
   const ruleBaseChecks = [hasRuleVariables, hasRules]
   const alternativesChecks = [
      hasAlternatives,
      alternativesCount > 0 ? hasCompleteTopsisEvaluations : null,
      alternativesCount > 0 && ruleVariablesCount > 0 ? hasRuleEvaluations : null
   ]
   const overallChecks = [...generalChecks, ...topsisChecks, ...ruleBaseChecks, ...alternativesChecks]

   return {
      has_categories: hasCategories,
      has_grade_policies: hasGradePolicies,
      has_valid_grade_ranges: hasValidGradeRanges,
      has_criteria: hasCriteria,
      has_balanced_weights: hasBalancedWeights,
      has_rule_variables: hasRuleVariables,
      has_rules: hasRules,
      has_alternatives: hasAlternatives,
      has_complete_topsis_evaluations: hasCompleteTopsisEvaluations,
      has_rule_evaluations: hasRuleEvaluations,
      has_recommendations: hasRecommendations,
      total_weight: totalWeight,
      expected_evaluation_cells: expectedEvaluationCells,
      completed_evaluation_cells: evaluationCount,
      expected_rule_evaluations: expectedRuleEvaluations,
      completed_rule_evaluations: ruleEvaluationCount,
      overall_progress: toProgress(overallChecks),
      is_ready: overallChecks.filter((item) => item !== null).every(Boolean)
   }
}

const createDecisionModelWithOwner = async ({ name, descriptions, userId }) => {
   if (!userId) {
      throw new ValidationError("Authenticated user is required")
   }

   return db.transaction(async (transaction) => {
      const decisionModel = await DecisionModel.create(
         {
            name,
            descriptions,
            created_at: new Date()
         },
         { transaction }
      )

      await DecisionModelUser.create(
         {
            decision_model_id: decisionModel.id,
            user_id: userId,
            role: ROLES.OWNER,
            created_at: new Date()
         },
         { transaction }
      )

      return decisionModel
   })
}

const computeDecisionModelReadiness = async (decisionModelId) => {
   const [
      categoriesCount,
      criteria,
      alternativesCount,
      ruleVariablesCount,
      rulesCount,
      evaluationCount,
      ruleEvaluationCount,
      recommendationCount,
      gradePolicies
   ] = await Promise.all([
      AssistanceCategory.count({ where: { decision_model_id: decisionModelId } }),
      Criteria.findAll({ where: { decision_model_id: decisionModelId }, attributes: ["id", "weight"] }),
      Alternative.count({ where: { decision_model_id: decisionModelId } }),
      RuleVariable.count({ where: { decision_model_id: decisionModelId } }),
      Rule.count({ where: { decision_model_id: decisionModelId } }),
      Evaluation.count({
         include: [{ association: "alternative", where: { decision_model_id: decisionModelId }, attributes: [] }]
      }),
      RuleEvaluation.count({
         include: [{ association: "alternative", where: { decision_model_id: decisionModelId }, attributes: [] }]
      }),
      Result.count({ where: { decision_model_id: decisionModelId } }),
      ResultGradePolicy.findAll({
         where: { decision_model_id: decisionModelId },
         include: [{ association: "ranges", attributes: ["id"] }]
      })
   ])

   return buildReadinessSummary({
      categoriesCount,
      criteria,
      alternativesCount,
      ruleVariablesCount,
      rulesCount,
      evaluationCount,
      ruleEvaluationCount,
      recommendationCount,
      gradePolicies
   })
}

const hydrateDecisionModelsWithReadiness = async (decisionModels) => {
   const readinessById = new Map(
      await Promise.all(
         decisionModels.map(async (model) => [
            model.id,
            await computeDecisionModelReadiness(model.id)
         ])
      )
   )

   return decisionModels.map((model) => ({
      ...model,
      readiness: readinessById.get(model.id)
   }))
}

module.exports = {
   buildReadinessSummary,
   computeDecisionModelReadiness,
   createDecisionModelWithOwner,
   hydrateDecisionModelsWithReadiness
}
