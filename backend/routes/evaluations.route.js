const express = require("express")
const router = express.Router()
const evaluationController = require("../controller/evaluations.controller")

router.post("/", evaluationController.createEvaluation)
router.get("/alternative/:alternativeId", evaluationController.getEvaluationsByAlternative)
router.get("/:id", evaluationController.getEvaluationById)
router.patch("/:id", evaluationController.updateEvaluation)
router.delete("/:id", evaluationController.deleteEvaluation)

module.exports = router
