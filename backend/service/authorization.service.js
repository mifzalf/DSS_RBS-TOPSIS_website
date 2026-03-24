const DecisionModelUser = require("../models/decisionModelUser")
const DecisionModel = require("../models/decisionModel")

const ROLES = Object.freeze({
   OWNER: "owner",
   EDITOR: "editor",
   VIEWER: "viewer"
})

class AuthorizationError extends Error {
   constructor(message, status = 403) {
      super(message)
      this.name = "AuthorizationError"
      this.status = status
   }
}

const ensureDecisionModelExists = async (decisionModelId) => {
   const decisionModel = await DecisionModel.findByPk(decisionModelId)

   if (!decisionModel) {
      throw new AuthorizationError("Decision model tidak ditemukan", 404)
   }

   return decisionModel
}

const ensureDecisionModelAccess = async ({ userId, decisionModelId, roles = [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER] }) => {
   if (!decisionModelId) {
      throw new AuthorizationError("Decision model tidak valid", 400)
   }

   const membership = await DecisionModelUser.findOne({
      where: {
         decision_model_id: decisionModelId,
         user_id: userId
      }
   })

   if (!membership) {
      throw new AuthorizationError("Pengguna tidak memiliki akses ke decision model ini", 403)
   }

   if (roles?.length && !roles.includes(membership.role)) {
      throw new AuthorizationError("Peran pengguna tidak memiliki izin untuk aksi ini", 403)
   }

   return membership
}

const listDecisionModelsForUser = async (userId) => {
   return DecisionModelUser.findAll({
      where: { user_id: userId },
      include: [
         {
            model: DecisionModel,
            attributes: ["id", "name", "descriptions", "created_at"]
         }
      ],
      order: [["created_at", "DESC"]]
   })
}

module.exports = {
   AuthorizationError,
   ensureDecisionModelAccess,
   ensureDecisionModelExists,
   listDecisionModelsForUser,
   ROLES
}
