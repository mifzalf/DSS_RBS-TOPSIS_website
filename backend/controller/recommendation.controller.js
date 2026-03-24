const DecisionModel = require("../models/decisionModel")
const Alternative = require("../models/alternatives")
const Result = require("../models/results")
const recommendationService = require("../service/DSS/recommendation.service")
const handleControllerError = require("../utils/controllerError")

const formatResult = (result, alternativesCache) => {
   const alternative = alternativesCache.get(result.alternative_id)

   return {
      id: result.id || null,
      alternative: alternative
         ? { id: alternative.id, name: alternative.name }
         : { id: result.alternative_id },
      category: result.category,
      preference_score: result.preference_score,
      rank: result.rank
   }
}

exports.generateRecommendation = async (req, res) => {
   try {
      const { decisionModelId } = req.params
      const clearPrevious = req.query.clear === "true"

      const decisionModel = req.decisionModel || await DecisionModel.findByPk(decisionModelId)

      if (!decisionModel) {
         return res.status(404).json({
            message: "Decision model tidak ditemukan"
         })
      }

      if (clearPrevious) {
         await Result.destroy({ where: { decision_model_id: decisionModelId } })
      }

      const recommendation = await recommendationService.generateRecommendation(decisionModelId)

      const alternatives = await Alternative.findAll({
         where: { decision_model_id: decisionModelId }
      })

      const cache = new Map(alternatives.map(item => [item.id, item]))

      const data = recommendation.map(item => formatResult(item, cache))

      return res.status(200).json({
         message: "Rekomendasi berhasil digenerate",
         decisionModel: {
            id: decisionModel.id,
            name: decisionModel.name
         },
         count: data.length,
         data
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
