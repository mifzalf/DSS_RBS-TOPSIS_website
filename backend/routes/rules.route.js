const express = require("express")
const createError = require("http-errors")
const router = express.Router()

const ruleController = require("../controller/rules.controller")
const ruleconditionController = require("../controller/ruleConditions.controller")
const Rule = require("../models/rules")
const RuleCondition = require("../models/ruleConditions")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")

const loadRuleByIdParam = (param = "id") => async (req) => {
   const rule = await Rule.findByPk(req.params[param] || req.body?.[param])

   if (!rule) {
      throw createError(404, "Rule not found")
   }

   req.rule = rule

   return rule.decision_model_id
}

const loadRuleFromBody = async (req) => {
   const ruleId = req.body?.rule_id

   const rule = await Rule.findByPk(ruleId)

   if (!rule) {
      throw createError(404, "Rule not found")
   }

   req.rule = rule

   return rule.decision_model_id
}

const loadRuleCondition = async (req) => {
   const condition = await RuleCondition.findByPk(req.params.id)

   if (!condition) {
      throw createError(404, "Rule condition not found")
   }

   req.ruleCondition = condition

   const rule = await Rule.findByPk(condition.rule_id)

   if (!rule) {
      throw createError(404, "Rule not found")
   }

   req.rule = rule

   return rule.decision_model_id
}

router.post(
   "/",
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleController.createRule
)

router.get(
   "/decision-model/:decision_model_id",
   authorizeDecisionModel({
      source: "params",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleController.getRulesByDecisionModel
)

router.get(
   "/:id",
   authorizeDecisionModel({
      getId: loadRuleByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleController.getRuleById
)

router.patch(
   "/:id",
   authorizeDecisionModel({
      getId: loadRuleByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleController.updateRule
)

router.delete(
   "/:id",
   authorizeDecisionModel({
      getId: loadRuleByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleController.deleteRule
)

router.post(
   "/conditions",
   authorizeDecisionModel({
      getId: loadRuleFromBody,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleconditionController.createRuleCondition
)

router.get(
   "/:ruleId/conditions",
   authorizeDecisionModel({
      getId: loadRuleByIdParam("ruleId"),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleconditionController.getConditionsByRule
)

router.get(
   "/conditions/:id",
   authorizeDecisionModel({
      getId: loadRuleCondition,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleconditionController.getRuleConditionById
)

router.patch(
   "/conditions/:id",
   authorizeDecisionModel({
      getId: loadRuleCondition,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleconditionController.updateRuleCondition
)

router.delete(
   "/conditions/:id",
   authorizeDecisionModel({
      getId: loadRuleCondition,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleconditionController.deleteRuleCondition
)

module.exports = router
