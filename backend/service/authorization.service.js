const DecisionModelUser = require("../models/decision-model-user.model")
const DecisionModel = require("../models/decision-model.model")

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
      throw new AuthorizationError("Decision model not found", 404)
   }

   return decisionModel
}

const ensureDecisionModelAccess = async ({ userId, decisionModelId, roles = [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER] }) => {
   if (!decisionModelId) {
      throw new AuthorizationError("Invalid decision model", 400)
   }

   const membership = await DecisionModelUser.findOne({
      where: {
         decision_model_id: decisionModelId,
         user_id: userId
      }
   })

   if (!membership) {
      throw new AuthorizationError("User does not have access to this decision model", 403)
   }

   if (roles?.length && !roles.includes(membership.role)) {
      throw new AuthorizationError("User role is not permitted for this action", 403)
   }

   return membership
}

const listDecisionModelsForUser = async (userId) => {
   return DecisionModelUser.findAll({
      where: { user_id: userId },
      include: [
         {
            association: "decisionModel",
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
