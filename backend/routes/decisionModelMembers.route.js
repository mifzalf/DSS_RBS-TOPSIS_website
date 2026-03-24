const express = require("express")
const router = express.Router({ mergeParams: true })

const memberController = require("../controller/decisionModelMember.controller")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
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

router.get("/", authorizeMemberViewer, memberController.listMembers)
router.post("/", authorizeMemberOwner, memberController.addMember)
router.patch("/:memberId", authorizeMemberOwner, memberController.updateMemberRole)
router.delete("/:memberId", authorizeMemberOwner, memberController.removeMember)

module.exports = router
