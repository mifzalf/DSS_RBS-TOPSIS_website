const express = require("express")
const router = express.Router()
const ruleController = require("../controller/rules.controller")
const ruleconditionController = require("../controller/ruleConditions.controller")

router.post("/", ruleController.createRule)
router.get("/decision-model/:decision_model_id", ruleController.getRulesByDecisionModel)
router.get("/:id", ruleController.getRuleById)
router.patch("/:id", ruleController.updateRule)
router.delete("/:id", ruleController.deleteRule)

router.post("/conditions", ruleconditionController.createRuleCondition)
router.get("/:ruleId/conditions/", ruleconditionController.getConditionsByRule)
router.get("/conditions/:id", ruleconditionController.getRuleConditionById)
router.patch("/conditions/:id", ruleconditionController.updateRuleCondition)
router.delete("/conditions/:id", ruleconditionController.deleteRuleCondition)   

module.exports = router