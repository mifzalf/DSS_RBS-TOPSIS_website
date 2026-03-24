const express = require("express")
const createError = require("http-errors")
const router = express.Router()

const decisionModelController = require("../controller/decisionModel.controller")
const decisionModelMemberRouter = require("./decisionModelMembers.route")
const DecisionModel = require("../models/decisionModel")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")

const loadDecisionModel = async (req) => {
   const decisionModel = await DecisionModel.findByPk(req.params.id)

   if (!decisionModel) {
      throw createError(404, "Decision Model not found")
   }

   req.decisionModel = decisionModel

   return decisionModel.id
}

router.post("/", decisionModelController.createDecisionModel)
router.get("/", decisionModelController.getAllDecisionModels)

router.get(
   "/:id",
   authorizeDecisionModel({
      getId: loadDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   decisionModelController.getDecisionModelById
)

router.patch(
   "/:id",
   authorizeDecisionModel({
      getId: loadDecisionModel,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   decisionModelController.updateDecisionModel
)

router.delete(
   "/:id",
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
