const express = require("express")
const router = express.Router()
const resultsController = require("../controller/results.controller")

router.get("/decision-model/:decision_model_id", resultsController.getResultsByDecisionModel)
router.get("/:id", resultsController.getResultById)
router.patch("/:id", resultsController.updateResult)
router.delete("/:id", resultsController.deleteResult)

module.exports = router