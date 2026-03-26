const express = require("express")
const router = express.Router()

const evaluationController = require("../controller/evaluation.controller")
const Evaluation = require("../models/evaluation.model")
const Alternative = require("../models/alternative.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadAlternativeByParam = (param = "alternativeId") => async (req) => {
   const alternative = await loadByPrimaryKey({
      req,
      model: Alternative,
      id: req.params[param] || req.body?.[param],
      requestKey: "alternative",
      notFoundMessage: "Alternative not found"
   })

   return alternative.decision_model_id
}

const loadAlternativeFromBody = async (req) => {
   const alternativeId = req.body?.alternative_id

   const alternative = await loadByPrimaryKey({
      req,
      model: Alternative,
      id: alternativeId,
      requestKey: "alternative",
      notFoundMessage: "Alternative not found"
   })

   return alternative.decision_model_id
}

const loadEvaluation = async (req) => {
   const evaluation = await loadByPrimaryKey({
      req,
      model: Evaluation,
      id: req.params.id,
      requestKey: "evaluation",
      notFoundMessage: "Evaluation not found"
   })

   const alternative = await loadByPrimaryKey({
      req,
      model: Alternative,
      id: evaluation.alternative_id,
      requestKey: "alternative",
      notFoundMessage: "Alternative not found"
   })

   return alternative.decision_model_id
}

router.post(
   "/",
   validateRequest(schemas.evaluation.create),
   authorizeDecisionModel({
      getId: loadAlternativeFromBody,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   evaluationController.createEvaluation
)

router.get(
   "/alternative/:alternativeId",
   validateRequest(schemas.evaluation.byAlternative),
   authorizeDecisionModel({
      getId: loadAlternativeByParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   evaluationController.getEvaluationsByAlternative
)

router.get(
   "/:id",
   validateRequest(schemas.evaluation.byId),
   authorizeDecisionModel({
      getId: loadEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   evaluationController.getEvaluationById
)

router.patch(
   "/:id",
   validateRequest(schemas.evaluation.update),
   authorizeDecisionModel({
      getId: loadEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   evaluationController.updateEvaluation
)

router.delete(
   "/:id",
   validateRequest(schemas.evaluation.byId),
   authorizeDecisionModel({
      getId: loadEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   evaluationController.deleteEvaluation
)

module.exports = router
