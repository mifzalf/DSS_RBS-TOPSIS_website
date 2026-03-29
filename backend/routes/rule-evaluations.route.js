const express = require("express")
const router = express.Router()

const ruleEvaluationController = require("../controller/rule-evaluation.controller")
const RuleEvaluation = require("../models/rule-evaluation.model")
const Alternative = require("../models/alternative.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadAlternative = async (req) => {
   const alternative = await loadByPrimaryKey({
      req,
      model: Alternative,
      id: req.params.alternativeId || req.body.alternative_id,
      requestKey: "alternative",
      notFoundMessage: "Alternative not found"
   })

   return alternative.decision_model_id
}

const loadRuleEvaluation = async (req) => {
   const ruleEvaluation = await loadByPrimaryKey({
      req,
      model: RuleEvaluation,
      id: req.params.id,
      requestKey: "ruleEvaluation",
      notFoundMessage: "Rule evaluation not found"
   })

   const alternative = await loadByPrimaryKey({
      req,
      model: Alternative,
      id: ruleEvaluation.alternative_id,
      requestKey: "alternative",
      notFoundMessage: "Alternative not found"
   })

   return alternative.decision_model_id
}

router.post(
   "/",
   validateRequest(schemas.ruleEvaluation.create),
   authorizeDecisionModel({
      getId: loadAlternative,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleEvaluationController.createRuleEvaluation
)

router.get(
   "/alternative/:alternativeId",
   validateRequest(schemas.ruleEvaluation.byAlternative),
   authorizeDecisionModel({
      getId: loadAlternative,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleEvaluationController.getRuleEvaluationsByAlternative
)

router.get(
   "/:id",
   validateRequest(schemas.ruleEvaluation.byId),
   authorizeDecisionModel({
      getId: loadRuleEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleEvaluationController.getRuleEvaluationById
)

router.patch(
   "/:id",
   validateRequest(schemas.ruleEvaluation.update),
   authorizeDecisionModel({
      getId: loadRuleEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleEvaluationController.updateRuleEvaluation
)

router.delete(
   "/:id",
   validateRequest(schemas.ruleEvaluation.byId),
   authorizeDecisionModel({
      getId: loadRuleEvaluation,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleEvaluationController.deleteRuleEvaluation
)

module.exports = router
