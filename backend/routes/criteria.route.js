const express = require("express")
const router = express.Router()
const criteriaController = require("../controller/criteria.controller")
const subcriteriaController = require("../controller/subCriteria.controller")

router.post("/", criteriaController.createCriteria)
router.get("/decision-model/:decisionModelId", criteriaController.getCriteriaByDecisionModel)
router.get("/:id", criteriaController.getCriteriaById)
router.patch("/:id", criteriaController.updateCriteria)
router.delete("/:id", criteriaController.deleteCriteria)

router.post("/:criteriaId/sub-criteria", subcriteriaController.createSubCriteria)
router.get("/:criteriaId/sub-criteria", subcriteriaController.getSubCriteriaByCriteria)
router.get("/sub-criteria/:id", subcriteriaController.getSubCriteriaById)
router.patch("/sub-criteria/:id", subcriteriaController.updateSubCriteria)
router.delete("/sub-criteria/:id", subcriteriaController.deleteSubCriteria)

module.exports = router