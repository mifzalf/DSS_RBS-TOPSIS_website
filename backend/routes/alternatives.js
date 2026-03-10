const express = require("express")
const router = express.Router()
const alternativeController = require("../controller/alternatives.controller")

router.post("/", alternativeController.createAlternatives) 
router.get("/decision-model/:decision_model_id", alternativeController.getAlternativessByDecisionModel) 
router.get("/:id", alternativeController.getAlternativesById)
router.patch("/:id", alternativeController.updateAlternatives) 
router.delete("/:id", alternativeController.deleteAlternatives) 

module.exports = router