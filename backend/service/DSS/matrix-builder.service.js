const Alternative = require("../../models/alternative.model")
const Criteria = require("../../models/criteria.model")
const Evaluation = require("../../models/evaluation.model")
const SubCriteria = require("../../models/sub-criteria.model")

const getSubCriteriaValue = (evaluation) => {
   return Number(evaluation?.subCriteria?.value || 0)
}

const buildMatrixForAlternatives = async ({ decisionModelId, alternativeIds: scopedAlternativeIds }) => {
   const alternativeWhere = { decision_model_id: decisionModelId }

   if (Array.isArray(scopedAlternativeIds)) {
      alternativeWhere.id = scopedAlternativeIds
   }

   const alternatives = await Alternative.findAll({
      where: alternativeWhere,
      order: [["id", "ASC"]]
   })

   const criteria = await Criteria.findAll({
      where: {
         decision_model_id: decisionModelId,
         status_active: true
      },
      order: [["id", "ASC"]]
   })

   const alternativeIds = alternatives.map(item => item.id)
   const criteriaIds = criteria.map(item => item.id)

   const evaluations = alternativeIds.length && criteriaIds.length
      ? await Evaluation.findAll({
         where: {
            alternative_id: alternativeIds,
            criteria_id: criteriaIds
         },
         include: [
            {
               association: "subCriteria",
               attributes: ["value"]
            }
         ]
      })
      : []

   const evaluationMap = new Map(
      evaluations.map(item => [
         `${item.alternative_id}:${item.criteria_id}`,
         getSubCriteriaValue(item)
      ])
   )

   const matrix = alternatives.map(alternative => (
      criteria.map(criterion => (
         evaluationMap.get(`${alternative.id}:${criterion.id}`) || 0
      ))
   ))

   return {
      matrix,
      alternatives,
      criteria
   }
}

const buildMatrix = async (decisionModelId) => {
   return buildMatrixForAlternatives({ decisionModelId })
}

module.exports = {
   buildMatrix,
   buildMatrixForAlternatives
}
