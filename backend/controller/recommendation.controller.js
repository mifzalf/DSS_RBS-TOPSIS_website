const DecisionModel = require("../models/decision-model.model")
const Alternative = require("../models/alternative.model")
const recommendationService = require("../service/DSS/recommendation.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")

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

      const decisionModel = req.decisionModel || await DecisionModel.findByPk(decisionModelId)

      if (!decisionModel) {
         return res.status(404).json({
            message: "Decision model not found"
         })
      }

      const recommendation = await recommendationService.generateRecommendation(decisionModelId)

      const alternatives = await Alternative.findAll({
         where: { decision_model_id: decisionModelId }
      })

      const cache = new Map(alternatives.map(item => [item.id, item]))

      const data = recommendation.map(item => formatResult(item, cache))

      return sendSuccess(res, {
         message: "Recommendation generated successfully",
         data,
         meta: {
            decisionModel: {
                id: decisionModel.id,
                name: decisionModel.name
             },
             count: data.length
          },
       })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
