const express = require("express")
const createError = require("http-errors")
const router = express.Router()

const alternativeController = require("../controller/alternatives.controller")
const Alternative = require("../models/alternatives")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")

const loadAlternativeDecisionModel = async (req) => {
   const alternative = await Alternative.findByPk(req.params.id)

   if (!alternative) {
      throw createError(404, "Alternatives not found")
   }

   req.alternative = alternative

   return alternative.decision_model_id
}

const authorizeAlternativeView = authorizeDecisionModel({
   getId: loadAlternativeDecisionModel,
   roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
})

const authorizeAlternativeManage = authorizeDecisionModel({
   getId: loadAlternativeDecisionModel,
   roles: [ROLES.OWNER, ROLES.EDITOR]
})

router.post(
   "/",
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   alternativeController.createAlternatives
)

router.get(
   "/decision-model/:decision_model_id",
   authorizeDecisionModel({
      source: "params",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   alternativeController.getAlternativessByDecisionModel
)

router.get("/:id", authorizeAlternativeView, alternativeController.getAlternativesById)
router.patch("/:id", authorizeAlternativeManage, alternativeController.updateAlternatives)
router.delete("/:id", authorizeAlternativeManage, alternativeController.deleteAlternatives)

module.exports = router
