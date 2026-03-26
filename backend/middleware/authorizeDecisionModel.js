const { AuthorizationError, ensureDecisionModelAccess, ROLES } = require("../service/authorization.service")

const getValueFromSource = (req, source, field) => {
   if (!source || !field) return undefined
   return req?.[source]?.[field]
}

const authorizeDecisionModel = ({
   source = "params",
   field = "decisionModelId",
   roles = [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER],
   getId
} = {}) => {
   return async (req, res, next) => {
      try {
         let decisionModelId

         if (typeof getId === "function") {
            decisionModelId = await getId(req)
         } else {
            decisionModelId = getValueFromSource(req, source, field)
         }

         if (!decisionModelId) {
            throw new AuthorizationError("Invalid decision model", 400)
         }

         const access = await ensureDecisionModelAccess({
            userId: req.currentUser.id,
            decisionModelId,
            roles
         })

         req.decisionModelAccess = access
         req.decisionModelId = decisionModelId

         next()
      } catch (error) {
         if (error.status) {
            return res.status(error.status).json({
               message: error.message
            })
         }

         return res.status(500).json({
            message: error.message
         })
      }
   }
}

module.exports = authorizeDecisionModel
module.exports.ROLES = ROLES
