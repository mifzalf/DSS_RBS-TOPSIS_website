const DecisionModel = require("../models/decision-model.model")
const Alternative = require("../models/alternative.model")
const recommendationService = require("../service/DSS/recommendation.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")

const formatGroupItems = (groups, alternativesCache) => {
   return groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
         const alternative = alternativesCache.get(item.alternative_id)

         return {
            alternative: alternative
               ? { id: alternative.id, name: alternative.name }
               : { id: item.alternative_id },
            category_id: item.category_id,
            grade_code: item.grade_code,
            grade_label: item.grade_label,
            preference_score: item.preference_score,
            rank: item.rank,
            status: item.status
         }
      })
   }))
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

      const data = {
         ranked_groups: formatGroupItems(recommendation.grouped.ranked_groups, cache),
         rejected_groups: formatGroupItems(recommendation.grouped.rejected_groups, cache)
      }

      return sendSuccess(res, {
         message: "Recommendation generated successfully",
         data,
          meta: {
            decisionModel: {
                id: decisionModel.id,
                name: decisionModel.name
              },
              count: recommendation.results.length,
              flat_results: recommendation.results
           },
        })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
