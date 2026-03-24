const Alternative = require("../../models/alternatives")
const Criteria = require("../../models/criteria")
const Evaluation = require("../../models/evaluations")
const SubCriteria = require("../../models/subCriteria")

exports.buildMatrix = async (decisionModelId)=>{

   const alternatives = await Alternative.findAll({
      where:{ decision_model_id:decisionModelId }
   })

   const criteria = await Criteria.findAll({
      where:{
         decision_model_id:decisionModelId,
         status_active:true
      }
   })

   const evaluations = await Evaluation.findAll({
      include:[
         {
            model:SubCriteria,
            attributes:["value"]
         }
      ]
   })

   const matrix = []

   for(const alternative of alternatives){

      const row = []

      for(const criterion of criteria){

         const evaluation = evaluations.find(e =>
            e.alternative_id === alternative.id &&
            e.criteria_id === criterion.id
         )

         const value = evaluation && evaluation.sub_criterium
            ? evaluation.sub_criterium.value
            : 0

         row.push(value)

      }

      matrix.push(row)

   }

   return {
      matrix,
      alternatives,
      criteria
   }

}