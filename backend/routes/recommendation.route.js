const express = require("express")
const router = express.Router()

const recommendationController = require("../controller/recommendation.controller")

router.post("/decision-model/:decisionModelId", recommendationController.generateRecommendation)

module.exports = router
