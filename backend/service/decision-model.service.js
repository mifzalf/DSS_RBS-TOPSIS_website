const { db } = require("../config/database")
const DecisionModel = require("../models/decision-model.model")
const DecisionModelUser = require("../models/decision-model-user.model")
const { ROLES } = require("./authorization.service")
const { ValidationError } = require("../utils/appError")

const createDecisionModelWithOwner = async ({ name, descriptions, userId }) => {
   if (!userId) {
      throw new ValidationError("Authenticated user is required")
   }

   return db.transaction(async (transaction) => {
      const decisionModel = await DecisionModel.create(
         {
            name,
            descriptions,
            created_at: new Date()
         },
         { transaction }
      )

      await DecisionModelUser.create(
         {
            decision_model_id: decisionModel.id,
            user_id: userId,
            role: ROLES.OWNER,
            created_at: new Date()
         },
         { transaction }
      )

      return decisionModel
   })
}

module.exports = {
   createDecisionModelWithOwner
}
