const express = require("express")
const createError = require("http-errors")
const router = express.Router()

const evaluationController = require("../controller/evaluations.controller")
const Evaluation = require("../models/evaluations")
const Alternative = require("../models/alternatives")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")

const loadAlternativeByParam = (param = "alternativeId") => async (req) => {
   const alternative = await Alternative.findByPk(req.params[param] || req.body?.[param])

   if (!alternative) {
      throw createError(404, "Alternative not found")
   }

   req.alternative = alternative

   return alternative.decision_model_id
}

const loadAlternativeFromBody = async (req) => {
   const alternativeId = req.body?.alternative_id

   const alternative = await Alternative.findByPk(alternativeId)

   if (!alternative) {
      throw createError(404, "Alternative not found")
   }

   req.alternative = alternative

   return alternative.decision_model_id
}

const loadEvaluation = async (req) => {
   const evaluation = await Evaluation.findByPk(req.params.id)

   if (!evaluation) {
      throw createError(404, "Evaluation not found")
   }

   req.evaluation = evaluation

   const alternative = await Alternative.findByPk(evaluation.alternative_id)

   if (!alternative) {
      throw createError(404, "Alternative not found")
   }

   req.alternative = alternative

   return alternative.decision_model_id
}

router.post(
   "/",
   authorizeDecisionModel({
      getId: loadAlternativeFromBody,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   evaluationController.createEvaluation
)

router.get(
   "/alternative/:alternativeId",
   authorizeDecisionModel({
      getId: loadAlternativeByParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   evaluationController.getEvaluationsByAlternative
)

router.get(
   "/:id",
   authorizeDecisionModel({
      getId: loadEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   evaluationController.getEvaluationById
)

router.patch(
   "/:id",
   authorizeDecisionModel({
      getId: loadEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   evaluationController.updateEvaluation
)

router.delete(
   "/:id",
   authorizeDecisionModel({
      getId: loadEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   evaluationController.deleteEvaluation
)

module.exports = router
