const express = require("express")
const router = express.Router()

const ruleVariableController = require("../controller/rule-variable.controller")
const RuleVariable = require("../models/rule-variable.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadRuleVariable = async (req) => {
   const ruleVariable = await loadByPrimaryKey({
      req,
      model: RuleVariable,
      id: req.params.id,
      requestKey: "ruleVariable",
      notFoundMessage: "Rule variable not found"
   })

   return ruleVariable.decision_model_id
}

router.post(
   "/",
   validateRequest(schemas.ruleVariable.create),
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleVariableController.createRuleVariable
)

router.get(
   "/decision-model/:decisionModelId",
   validateRequest(schemas.ruleVariable.byDecisionModel),
   authorizeDecisionModel({
      source: "params",
      field: "decisionModelId",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleVariableController.getRuleVariablesByDecisionModel
)

router.get(
   "/:id",
   validateRequest(schemas.ruleVariable.byId),
   authorizeDecisionModel({
      getId: loadRuleVariable,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   ruleVariableController.getRuleVariableById
)

router.patch(
   "/:id",
   validateRequest(schemas.ruleVariable.update),
   authorizeDecisionModel({
      getId: loadRuleVariable,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleVariableController.updateRuleVariable
)

router.delete(
   "/:id",
   validateRequest(schemas.ruleVariable.byId),
   authorizeDecisionModel({
      getId: loadRuleVariable,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   ruleVariableController.deleteRuleVariable
)

module.exports = router
