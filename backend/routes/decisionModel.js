const express = require("express")
const router = express.Router()
const decisionModelController = require("../controller/decisionModel.controller")

router.post("/", decisionModelController.createDecisionModel)
router.get("/", decisionModelController.getAllDecisionModels)
router.get("/:id", decisionModelController.getDecisionModelById)
router.patch("/:id", decisionModelController.updateDecisionModel)
router.delete("/:id", decisionModelController.deleteDecisionModel)

module.exports = router