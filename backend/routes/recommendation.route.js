const express = require("express")
const createError = require("http-errors")
const router = express.Router()

const recommendationController = require("../controller/recommendation.controller")
const DecisionModel = require("../models/decisionModel")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")

const loadDecisionModel = async (req) => {
   const decisionModel = await DecisionModel.findByPk(req.params.decisionModelId)

   if (!decisionModel) {
      throw createError(404, "Decision model not found")
   }

   req.decisionModel = decisionModel

   return decisionModel.id
}

router.post(
   "/decision-model/:decisionModelId",
   authorizeDecisionModel({
      getId: loadDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   recommendationController.generateRecommendation
)

module.exports = router
