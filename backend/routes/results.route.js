const express = require("express")
const createError = require("http-errors")
const router = express.Router()

const resultsController = require("../controller/results.controller")
const Result = require("../models/results")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")

const loadResult = async (req) => {
   const result = await Result.findByPk(req.params.id)

   if (!result) {
      throw createError(404, "Result not found")
   }

   req.result = result

   return result.decision_model_id
}

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
