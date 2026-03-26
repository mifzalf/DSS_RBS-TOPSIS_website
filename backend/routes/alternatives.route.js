const express = require("express")
const router = express.Router()

const alternativeController = require("../controller/alternative.controller")
const Alternative = require("../models/alternative.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadAlternativeDecisionModel = async (req) => {
   const alternative = await loadByPrimaryKey({
      req,
      model: Alternative,
      id: req.params.id,
      requestKey: "alternative",
      notFoundMessage: "Alternative not found"
   })

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
   validateRequest(schemas.alternative.create),
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
    alternativeController.createAlternative
)

router.get(
   "/decision-model/:decisionModelId",
   validateRequest(schemas.alternative.byDecisionModel),
   authorizeDecisionModel({
      source: "params",
      field: "decisionModelId",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   alternativeController.getAlternativesByDecisionModel
)

router.get(
   "/decision-model/:decision_model_id",
   validateRequest(schemas.alternative.byDecisionModelLegacy),
   authorizeDecisionModel({
      source: "params",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   alternativeController.getAlternativesByDecisionModel
)

router.get("/:id", validateRequest(schemas.alternative.byId), authorizeAlternativeView, alternativeController.getAlternativeById)
router.patch("/:id", validateRequest(schemas.alternative.update), authorizeAlternativeManage, alternativeController.updateAlternative)
router.delete("/:id", validateRequest(schemas.alternative.byId), authorizeAlternativeManage, alternativeController.deleteAlternative)

module.exports = router
