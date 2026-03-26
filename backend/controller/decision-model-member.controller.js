const DecisionModelUser = require("../models/decision-model-user.model")
const User = require("../models/user.model")
const {
   AuthorizationError,
   ROLES
} = require("../service/authorization.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")

const ensureOwnerCountAfterChange = async (decisionModelId, isRemoval = false) => {
   const ownerCount = await DecisionModelUser.count({
      where: {
         decision_model_id: decisionModelId,
         role: ROLES.OWNER
      }
   })

   if (ownerCount <= 1 && isRemoval) {
      throw new AuthorizationError("Decision model must have at least one owner", 400)
   }

   return ownerCount
}

exports.listMembers = async (req, res) => {
   try {
      const decisionModelId = req.decisionModelId || req.params.decisionModelId

      const members = await DecisionModelUser.findAll({
         where: { decision_model_id: decisionModelId },
          include: [
             {
                association: "user",
                attributes: ["id", "name", "username"]
             }
          ],
         order: [["role", "ASC"], ["created_at", "ASC"]]
      })

      const data = members.map(member => ({
         id: member.id,
         role: member.role,
         user: member.user
      }))

      return sendSuccess(res, {
         message: "Member list retrieved successfully",
         data
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.addMember = async (req, res) => {
   try {
      const decisionModelId = req.decisionModelId || req.params.decisionModelId
      const { user_id, role } = req.body

      if (!Object.values(ROLES).includes(role)) {
         throw new AuthorizationError("Invalid role", 400)
      }

      const targetUser = await User.findByPk(user_id)

      if (!targetUser) {
         return res.status(404).json({
            message: "User not found"
         })
      }

      const existing = await DecisionModelUser.findOne({
         where: {
            decision_model_id: decisionModelId,
            user_id
         }
      })

      if (existing) {
         return res.status(400).json({
            message: "User is already a member of this decision model"
         })
      }

      const membership = await DecisionModelUser.create({
         decision_model_id: decisionModelId,
         user_id,
         role,
         created_at: new Date()
      })

      return sendSuccess(res, {
         status: 201,
         message: "Member added successfully",
         data: {
             id: membership.id,
             role: membership.role,
            user: {
               id: targetUser.id,
               name: targetUser.name,
               username: targetUser.username
            }
         }
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.updateMemberRole = async (req, res) => {
   try {
      const decisionModelId = req.decisionModelId || req.params.decisionModelId
      const { memberId } = req.params
      const { role } = req.body

      if (!Object.values(ROLES).includes(role)) {
         throw new AuthorizationError("Invalid role", 400)
      }

      const membership = await DecisionModelUser.findOne({
         where: {
            id: memberId,
            decision_model_id: decisionModelId
         }
      })

      if (!membership) {
           return res.status(404).json({
              message: "Member not found"
           })
      }

      if (membership.role === ROLES.OWNER && role !== ROLES.OWNER) {
         await ensureOwnerCountAfterChange(decisionModelId, true)
      }

      membership.role = role
      await membership.save()

      return sendSuccess(res, {
         message: "Member role updated successfully",
         data: membership
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.removeMember = async (req, res) => {
   try {
      const decisionModelId = req.decisionModelId || req.params.decisionModelId
      const { memberId } = req.params

      const membership = await DecisionModelUser.findOne({
         where: {
            id: memberId,
            decision_model_id: decisionModelId
         }
      })

      if (!membership) {
         return res.status(404).json({
            message: "Member not found"
         })
      }

      if (membership.role === ROLES.OWNER) {
         await ensureOwnerCountAfterChange(decisionModelId, true)
      }

      await membership.destroy()

      return sendSuccess(res, {
         message: "Member removed successfully"
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
