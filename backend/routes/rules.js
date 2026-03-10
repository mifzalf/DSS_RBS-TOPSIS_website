const express = require("express")
const router = express.Router()
const ruleController = require("../controller/rules.controller")

router.post("/", ruleController.createRule)
router.get("/decision-model/:decision_model_id", ruleController.getRulesByDecisionModel)
router.get("/:id", ruleController.getRuleById)
router.patch("/:id", ruleController.updateRule)
router.delete("/:id", ruleController.deleteRule)

module.exports = router