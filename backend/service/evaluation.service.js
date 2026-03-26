const Evaluation = require("../models/evaluation.model")
const Alternative = require("../models/alternative.model")
const Criteria = require("../models/criteria.model")
const SubCriteria = require("../models/sub-criteria.model")
const { ConflictError, NotFoundError, ValidationError } = require("../utils/appError")

const loadIntegrityContext = async ({ alternativeId, criteriaId, subCriteriaId }) => {
   const [alternative, criteria, subCriteria] = await Promise.all([
      Alternative.findByPk(alternativeId),
      Criteria.findByPk(criteriaId),
      SubCriteria.findByPk(subCriteriaId)
   ])

   if (!alternative) {
      throw new NotFoundError("Alternative not found")
   }

   if (!criteria) {
      throw new NotFoundError("Criteria not found")
   }

   if (!subCriteria) {
      throw new NotFoundError("Sub-criteria not found")
   }

   if (criteria.decision_model_id !== alternative.decision_model_id) {
      throw new ValidationError("Criteria must belong to the same decision model as the alternative")
   }

   if (subCriteria.criteria_id !== criteria.id) {
      throw new ValidationError("Sub-criteria must belong to the selected criteria")
   }

   return {
      alternative,
      criteria,
      subCriteria
   }
}

const assertEvaluationUnique = async ({ alternativeId, criteriaId, currentEvaluationId }) => {
   const existing = await Evaluation.findOne({
      where: {
         alternative_id: alternativeId,
         criteria_id: criteriaId
      }
   })

   if (existing && existing.id !== currentEvaluationId) {
      throw new ConflictError("An evaluation already exists for this alternative and criteria")
   }
}

const createEvaluation = async ({ alternative_id, criteria_id, sub_criteria_id }) => {
   await loadIntegrityContext({
      alternativeId: alternative_id,
      criteriaId: criteria_id,
      subCriteriaId: sub_criteria_id
   })

   await assertEvaluationUnique({
      alternativeId: alternative_id,
      criteriaId: criteria_id
   })

   return Evaluation.create({
      alternative_id,
      criteria_id,
      sub_criteria_id
   })
}

const updateEvaluation = async (evaluation, { sub_criteria_id }) => {
   const criteriaId = evaluation.criteria_id
   const alternativeId = evaluation.alternative_id

   await loadIntegrityContext({
      alternativeId,
      criteriaId,
      subCriteriaId: sub_criteria_id
   })

   await evaluation.update({ sub_criteria_id })
   return evaluation
}

module.exports = {
   createEvaluation,
   updateEvaluation
}
