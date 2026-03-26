const express = require("express")
const router = express.Router({ mergeParams: true })

const memberController = require("../controller/decision-model-member.controller")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")

const authorizeMemberViewer = authorizeDecisionModel({
   source: "params",
   field: "decisionModelId",
   roles: [ROLES.OWNER, ROLES.EDITOR]
})

const authorizeMemberOwner = authorizeDecisionModel({
   source: "params",
   field: "decisionModelId",
   roles: [ROLES.OWNER]
})

router.get("/", validateRequest(schemas.decisionModelMember.list), authorizeMemberViewer, memberController.listMembers)
router.post("/", validateRequest(schemas.decisionModelMember.create), authorizeMemberOwner, memberController.addMember)
router.patch("/:memberId", validateRequest(schemas.decisionModelMember.update), authorizeMemberOwner, memberController.updateMemberRole)
router.delete("/:memberId", validateRequest(schemas.decisionModelMember.remove), authorizeMemberOwner, memberController.removeMember)

module.exports = router
