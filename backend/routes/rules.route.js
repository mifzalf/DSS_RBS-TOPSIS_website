const express = require("express")
const router = express.Router()

const ruleController = require("../controller/rule.controller")
const ruleconditionController = require("../controller/rule-condition.controller")
const Rule = require("../models/rule.model")
const RuleCondition = require("../models/rule-condition.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadRuleByIdParam = (param = "id") => async (req) => {
   const rule = await loadByPrimaryKey({
      req,
      model: Rule,
      id: req.params[param] || req.body?.[param],
      requestKey: "rule",
      notFoundMessage: "Rule not found"
   })

   return rule.decision_model_id
}

const loadRuleFromBody = async (req) => {
   const ruleId = req.body?.rule_id

   const rule = await loadByPrimaryKey({
      req,
      model: Rule,
      id: ruleId,
      requestKey: "rule",
      notFoundMessage: "Rule not found"
   })

   return rule.decision_model_id
}

const loadRuleCondition = async (req) => {
   const condition = await loadByPrimaryKey({
      req,
      model: RuleCondition,
      id: req.params.id,
      requestKey: "ruleCondition",
      notFoundMessage: "Rule condition not found"
   })

   const rule = await loadByPrimaryKey({
      req,
      model: Rule,
      id: condition.rule_id,
      requestKey: "rule",
      notFoundMessage: "Rule not found"
   })

   return rule.decision_model_id
}

router.post(
   "/",
   validateRequest(schemas.rule.create),
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleController.createRule
)

router.get(
   "/decision-model/:decisionModelId",
   validateRequest(schemas.rule.byDecisionModel),
   authorizeDecisionModel({
      source: "params",
      field: "decisionModelId",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleController.getRulesByDecisionModel
)

router.get(
   "/decision-model/:decision_model_id",
   validateRequest(schemas.rule.byDecisionModelLegacy),
   authorizeDecisionModel({
      source: "params",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleController.getRulesByDecisionModel
)

router.get(
   "/:id",
   validateRequest(schemas.rule.byId),
   authorizeDecisionModel({
      getId: loadRuleByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleController.getRuleById
)

router.patch(
   "/:id",
   validateRequest(schemas.rule.update),
   authorizeDecisionModel({
      getId: loadRuleByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleController.updateRule
)

router.delete(
   "/:id",
   validateRequest(schemas.rule.byId),
   authorizeDecisionModel({
      getId: loadRuleByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleController.deleteRule
)

router.post(
   "/conditions",
   validateRequest(schemas.ruleCondition.create),
   authorizeDecisionModel({
      getId: loadRuleFromBody,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleconditionController.createRuleCondition
)

router.get(
   "/:ruleId/conditions",
   validateRequest(schemas.ruleCondition.byRule),
   authorizeDecisionModel({
      getId: loadRuleByIdParam("ruleId"),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleconditionController.getConditionsByRule
)

router.get(
   "/conditions/:id",
   validateRequest(schemas.ruleCondition.byId),
   authorizeDecisionModel({
      getId: loadRuleCondition,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleconditionController.getRuleConditionById
)

router.patch(
   "/conditions/:id",
   validateRequest(schemas.ruleCondition.update),
   authorizeDecisionModel({
      getId: loadRuleCondition,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleconditionController.updateRuleCondition
)

router.delete(
   "/conditions/:id",
   validateRequest(schemas.ruleCondition.byId),
   authorizeDecisionModel({
      getId: loadRuleCondition,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleconditionController.deleteRuleCondition
)

module.exports = router
