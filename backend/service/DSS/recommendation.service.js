const ruleEngine = require("./rule-engine.service")
const matrixBuilder = require("./matrix-builder.service")
const topsis = require("./topsis.service")
const gradingService = require("../grading.service")

const { db } = require("../../config/database")
const Result = require("../../models/result.model")

class RecommendationGenerationError extends Error {
   constructor(message, status = 400) {
      super(message)
      this.name = "RecommendationGenerationError"
      this.status = status
   }
}

const validateAlternativeAvailability = (matrixData) => {
   if (!matrixData.alternatives.length) {
      throw new RecommendationGenerationError("No active alternatives found for this decision model")
   }
}

const validateRankedGroupInput = (matrixData, category) => {
    if (!matrixData.criteria.length) {
      throw new RecommendationGenerationError(`No active criteria found for category ${category}`)
    }
}

const groupRuleResultsByCategory = (ruleResults) => {
   return ruleResults.reduce((groups, item) => {
      const category = item.category || "Unclassified"

      if (!groups[category]) {
         groups[category] = {
            categoryId: item.category_id || null,
            category,
            isRanked: item.is_ranked !== false,
            actionType: item.action_type || null,
            items: []
         }
      }

      groups[category].items.push(item)

      return groups
   }, {})
}

const buildAlternativeLookup = (alternatives) => {
   return new Map(alternatives.map(item => [item.id, item]))
}

const generateRankedGroupResults = async ({ decisionModelId, categoryGroup }) => {
   const alternativeIds = categoryGroup.items.map(item => item.alternative_id)
   const matrixData = await matrixBuilder.buildMatrixForAlternatives({
      decisionModelId,
      alternativeIds
   })

   validateRankedGroupInput(matrixData, categoryGroup.category)

   const ranking = topsis.calculateTopsis(matrixData.matrix, matrixData.criteria)

   return ranking.map((item) => {
      const alternative = matrixData.alternatives[item.alternative]

      return {
         decision_model_id: decisionModelId,
         alternative_id: alternative.id,
         category_id: categoryGroup.categoryId,
         category: categoryGroup.category,
         action_type: categoryGroup.actionType,
         grade_code: null,
         grade_label: null,
         preference_score: item.score,
         rank: item.rank,
         status: "ranked"
      }
   })
}

const generateRejectedGroupResults = ({ decisionModelId, categoryGroup }) => {
   return categoryGroup.items.map((item) => ({
      decision_model_id: decisionModelId,
      alternative_id: item.alternative_id,
      category_id: categoryGroup.categoryId,
      category: categoryGroup.category,
      action_type: categoryGroup.actionType,
      grade_code: null,
      grade_label: null,
      preference_score: null,
      rank: null,
      status: "rejected"
   }))
}

const serializeGroupedResponse = (results, alternatives) => {
   const alternativeLookup = buildAlternativeLookup(alternatives)
   const grouped = results.reduce((accumulator, result) => {
      const categoryKey = result.category || "Unclassified"
      const key = `${result.status}:${categoryKey}`

      if (!accumulator[key]) {
         accumulator[key] = {
            category_id: result.category_id,
            category: categoryKey,
            action_type: result.action_type || null,
            status: result.status,
            items: []
         }
      }

      accumulator[key].items.push({
         alternative_id: result.alternative_id,
         category_id: result.category_id,
         alternative: alternativeLookup.get(result.alternative_id) || null,
         grade_code: result.grade_code,
         grade_label: result.grade_label,
         preference_score: result.preference_score,
         rank: result.rank,
         status: result.status
      })

      return accumulator
   }, {})

   const groups = Object.values(grouped).map((group) => {
      const items = [...group.items].sort((left, right) => {
         if (left.rank === null && right.rank === null) return left.alternative_id - right.alternative_id
         if (left.rank === null) return 1
         if (right.rank === null) return -1
         return left.rank - right.rank
      })

      return {
         ...group,
         items
      }
   })

   return {
      ranked_groups: groups.filter(group => group.status === "ranked"),
      rejected_groups: groups.filter(group => group.status === "rejected")
   }
}

exports.generateRecommendation = async (decisionModelId) => {
   const ruleResult = await ruleEngine.runRuleEngine(decisionModelId)
   const baseMatrixData = await matrixBuilder.buildMatrix(decisionModelId)
   validateAlternativeAvailability(baseMatrixData)

   const groupedRuleResults = Object.values(groupRuleResultsByCategory(ruleResult))
   const rankedGroups = groupedRuleResults.filter(group => group.isRanked)
   const rejectedGroups = groupedRuleResults.filter(group => !group.isRanked)

   const rankedResults = []
   for (const group of rankedGroups) {
      const groupResults = await generateRankedGroupResults({
         decisionModelId,
         categoryGroup: group
      })
      rankedResults.push(...groupResults)
   }

   const rejectedResults = rejectedGroups.flatMap(group => (
      generateRejectedGroupResults({
         decisionModelId,
         categoryGroup: group
      })
   ))

   const results = await gradingService.applyGrades({
      decisionModelId,
      results: [...rankedResults, ...rejectedResults]
   })

   await db.transaction(async (transaction) => {
      await Result.destroy({
         where: { decision_model_id: decisionModelId },
         transaction
      })

      if (results.length) {
         await Result.bulkCreate(
            results.map(result => ({
                decision_model_id: result.decision_model_id,
                alternative_id: result.alternative_id,
                category_id: result.category_id,
                category: result.category,
                grade_code: result.grade_code,
               grade_label: result.grade_label,
               preference_score: result.preference_score,
               rank: result.rank,
               iteration: 1,
               status: result.status,
               created_at: new Date()
            })),
            { transaction }
         )
      }
   })

   return {
      results,
      grouped: serializeGroupedResponse(results, baseMatrixData.alternatives)
   }
}

module.exports.RecommendationGenerationError = RecommendationGenerationError
module.exports.groupRuleResultsByCategory = groupRuleResultsByCategory
module.exports.generateRejectedGroupResults = generateRejectedGroupResults
module.exports.serializeGroupedResponse = serializeGroupedResponse
