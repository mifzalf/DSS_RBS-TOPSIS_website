const ruleEngine = require("./rule-engine.service")
const matrixBuilder = require("./matrix-builder.service")
const topsis = require("./topsis.service")

const { db } = require("../../config/database")
const Result = require("../../models/result.model")

class RecommendationGenerationError extends Error {
   constructor(message, status = 400) {
      super(message)
      this.name = "RecommendationGenerationError"
      this.status = status
   }
}

const validateRecommendationInput = (matrixData) => {
   if (!matrixData.alternatives.length) {
      throw new RecommendationGenerationError("No active alternatives found for this decision model")
   }

   if (!matrixData.criteria.length) {
      throw new RecommendationGenerationError("No active criteria found for this decision model")
   }
}

exports.generateRecommendation = async (decisionModelId) => {
   const ruleResult = await ruleEngine.runRuleEngine(decisionModelId)
   const matrixData = await matrixBuilder.buildMatrix(decisionModelId)
   validateRecommendationInput(matrixData)

   const ranking = topsis.calculateTopsis(
      matrixData.matrix,
      matrixData.criteria
    )

   const results = ranking.map(r => {
      const alternative = matrixData.alternatives[r.alternative]

      const rule = ruleResult.find(
         item => item.alternative_id === alternative.id
      )

      return {
         decision_model_id: decisionModelId,
         alternative_id: alternative.id,
         category: rule ? rule.category : null,
         preference_score: r.score,
         rank: r.rank
      }
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
               category: result.category,
               preference_score: result.preference_score,
               rank: result.rank,
               iteration: 1,
               status: "generated",
               created_at: new Date()
            })),
            { transaction }
         )
      }
   })

   return results
}

module.exports.RecommendationGenerationError = RecommendationGenerationError
