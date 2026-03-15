const ruleEngine = require("./ruleEngine.service")
const matrixBuilder = require("./matrixBuilder.service")
const topsis = require("./topsis.service")

const Result = require("../models/results")

exports.generateRecommendation = async (decisionModelId) => {

   const ruleResult = await ruleEngine.runRuleEngine(decisionModelId)

   const matrixData = await matrixBuilder.buildMatrix(decisionModelId)

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

   for(const result of results){

      await Result.create({
         decision_model_id: result.decision_model_id,
         alternative_id: result.alternative_id,
         category: result.category,
         preference_score: result.preference_score,
         rank: result.rank,
         iteration: 1,
         status: "generated",
         created_at: new Date()
      })

   }

   return results

}