const express = require("express")
const router = express.Router()

const recommendationController = require("../controller/recommendation.controller")
const DecisionModel = require("../models/decision-model.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadDecisionModel = async (req) => {
   const decisionModel = await loadByPrimaryKey({
      req,
      model: DecisionModel,
      id: req.params.decisionModelId,
      requestKey: "decisionModel",
      notFoundMessage: "Decision model not found"
   })

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
