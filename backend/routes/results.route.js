const express = require("express")
const router = express.Router()

const resultsController = require("../controller/result.controller")
const Result = require("../models/result.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadResult = async (req) => {
   const result = await loadByPrimaryKey({
      req,
      model: Result,
      id: req.params.id,
      requestKey: "result",
      notFoundMessage: "Result not found"
   })

   return result.decision_model_id
}

router.get(
   "/decision-model/:decisionModelId",
   authorizeDecisionModel({
      source: "params",
      field: "decisionModelId",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   resultsController.getResultsByDecisionModel
)

router.get(
   "/decision-model/:decision_model_id",
   authorizeDecisionModel({
      source: "params",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   resultsController.getResultsByDecisionModel
)

router.get(
   "/:id",
   authorizeDecisionModel({
      getId: loadResult,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   resultsController.getResultById
)

router.patch(
   "/:id",
   authorizeDecisionModel({
      getId: loadResult,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   resultsController.updateResult
)

router.delete(
   "/:id",
   authorizeDecisionModel({
      getId: loadResult,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   resultsController.deleteResult
)

module.exports = router
