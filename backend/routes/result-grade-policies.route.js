const express = require("express")
const router = express.Router()

const controller = require("../controller/result-grade-policy.controller")
const ResultGradePolicy = require("../models/result-grade-policy.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadPolicy = async (req) => {
   const policy = await loadByPrimaryKey({
      req,
      model: ResultGradePolicy,
      id: req.params.id,
      requestKey: "resultGradePolicy",
      notFoundMessage: "Result grade policy not found"
   })

   return policy.decision_model_id
}

router.post(
   "/",
   validateRequest(schemas.resultGradePolicy.create),
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.createGradePolicy
)

router.get(
   "/decision-model/:decisionModelId",
   validateRequest(schemas.resultGradePolicy.byDecisionModel),
   authorizeDecisionModel({
      source: "params",
      field: "decisionModelId",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   controller.getPoliciesByDecisionModel
)

router.get(
   "/:id",
   validateRequest(schemas.resultGradePolicy.byId),
   authorizeDecisionModel({
      getId: loadPolicy,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   controller.getPolicyById
)

router.patch(
   "/:id",
   validateRequest(schemas.resultGradePolicy.update),
   authorizeDecisionModel({
      getId: loadPolicy,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.updatePolicy
)

router.delete(
   "/:id",
   validateRequest(schemas.resultGradePolicy.byId),
   authorizeDecisionModel({
      getId: loadPolicy,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.deletePolicy
)

module.exports = router
