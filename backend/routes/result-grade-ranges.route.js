const express = require("express")
const router = express.Router()

const controller = require("../controller/result-grade-range.controller")
const ResultGradeRange = require("../models/result-grade-range.model")
const ResultGradePolicy = require("../models/result-grade-policy.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadPolicyDecisionModel = async (req) => {
   const policy = await loadByPrimaryKey({
      req,
      model: ResultGradePolicy,
      id: req.params.policyId || req.body.result_grade_policy_id,
      requestKey: "resultGradePolicy",
      notFoundMessage: "Result grade policy not found"
   })

   return policy.decision_model_id
}

const loadRangeDecisionModel = async (req) => {
   const range = await loadByPrimaryKey({
      req,
      model: ResultGradeRange,
      id: req.params.id,
      requestKey: "resultGradeRange",
      notFoundMessage: "Result grade range not found"
   })

   const policy = await loadByPrimaryKey({
      req,
      model: ResultGradePolicy,
      id: range.result_grade_policy_id,
      requestKey: "resultGradePolicy",
      notFoundMessage: "Result grade policy not found"
   })

   return policy.decision_model_id
}

router.post(
   "/",
   validateRequest(schemas.resultGradeRange.create),
   authorizeDecisionModel({
      getId: loadPolicyDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.createGradeRange
)

router.get(
   "/policy/:policyId",
   validateRequest(schemas.resultGradeRange.byPolicy),
   authorizeDecisionModel({
      getId: loadPolicyDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   controller.getRangesByPolicy
)

router.get(
   "/:id",
   validateRequest(schemas.resultGradeRange.byId),
   authorizeDecisionModel({
      getId: loadRangeDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   controller.getRangeById
)

router.patch(
   "/:id",
   validateRequest(schemas.resultGradeRange.update),
   authorizeDecisionModel({
      getId: loadRangeDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.updateRange
)

router.delete(
   "/:id",
   validateRequest(schemas.resultGradeRange.byId),
   authorizeDecisionModel({
      getId: loadRangeDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.deleteRange
)

module.exports = router
