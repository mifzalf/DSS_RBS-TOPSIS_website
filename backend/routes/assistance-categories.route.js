const express = require("express")
const router = express.Router()

const controller = require("../controller/assistance-category.controller")
const AssistanceCategory = require("../models/assistance-category.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadCategory = async (req) => {
   const category = await loadByPrimaryKey({
      req,
      model: AssistanceCategory,
      id: req.params.id,
      requestKey: "assistanceCategory",
      notFoundMessage: "Assistance category not found"
   })

   return category.decision_model_id
}

router.post(
   "/",
   validateRequest(schemas.assistanceCategory.create),
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.createAssistanceCategory
)

router.get(
   "/decision-model/:decisionModelId",
   validateRequest(schemas.assistanceCategory.byDecisionModel),
   authorizeDecisionModel({
      source: "params",
      field: "decisionModelId",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   controller.getCategoriesByDecisionModel
)

router.get(
   "/:id",
   validateRequest(schemas.assistanceCategory.byId),
   authorizeDecisionModel({
      getId: loadCategory,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   controller.getCategoryById
)

router.patch(
   "/:id",
   validateRequest(schemas.assistanceCategory.update),
   authorizeDecisionModel({
      getId: loadCategory,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.updateCategory
)

router.delete(
   "/:id",
   validateRequest(schemas.assistanceCategory.byId),
   authorizeDecisionModel({
      getId: loadCategory,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   controller.deleteCategory
)

module.exports = router
