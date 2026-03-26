const express = require("express")
const router = express.Router()

const decisionModelController = require("../controller/decision-model.controller")
const decisionModelMemberRouter = require("./decisionModelMembers.route")
const DecisionModel = require("../models/decision-model.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadDecisionModel = async (req) => {
   const decisionModel = await loadByPrimaryKey({
      req,
      model: DecisionModel,
      id: req.params.id,
      requestKey: "decisionModel",
      notFoundMessage: "Decision model not found"
   })

   return decisionModel.id
}

router.post("/", validateRequest(schemas.decisionModel.create), decisionModelController.createDecisionModel)
router.get("/", decisionModelController.getAllDecisionModels)

router.get(
   "/:id",
   validateRequest(schemas.decisionModel.idParam),
   authorizeDecisionModel({
      getId: loadDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   decisionModelController.getDecisionModelById
)

router.patch(
   "/:id",
   validateRequest(schemas.decisionModel.update),
   authorizeDecisionModel({
      getId: loadDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   decisionModelController.updateDecisionModel
)

router.delete(
   "/:id",
   validateRequest(schemas.decisionModel.idParam),
   authorizeDecisionModel({
      getId: loadDecisionModel,
      roles: [ROLES.OWNER]
   }),
   decisionModelController.deleteDecisionModel
)

router.use(
   "/:decisionModelId/members",
   decisionModelMemberRouter
)

module.exports = router
