const { Op } = require("sequelize")

const User = require("../models/user.model")
const DecisionModelUser = require("../models/decision-model-user.model")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")

exports.searchUsers = async (req, res) => {
   try {
      const query = String(req.query.q || "").trim()
      const decisionModelId = req.query.decisionModelId

      if (!query) {
         return sendSuccess(res, {
            message: "User search completed successfully",
            data: []
         })
      }

      let excludedUserIds = []

      if (decisionModelId) {
         const memberships = await DecisionModelUser.findAll({
            where: { decision_model_id: decisionModelId },
            attributes: ["user_id"]
         })

         excludedUserIds = memberships.map(item => item.user_id)
      }

      const users = await User.findAll({
         where: {
            [Op.and]: [
               {
                  [Op.or]: [
                     { name: { [Op.like]: `%${query}%` } },
                     { username: { [Op.like]: `%${query}%` } }
                  ]
               },
               excludedUserIds.length ? { id: { [Op.notIn]: excludedUserIds } } : {}
            ]
         },
         attributes: ["id", "name", "username"],
         order: [["name", "ASC"]],
         limit: 20
      })

      return sendSuccess(res, {
         message: "User search completed successfully",
         data: users
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
