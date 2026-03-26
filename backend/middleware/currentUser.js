const User = require("../models/user.model")

const currentUser = async (req, res, next) => {
   try {
      const requestUserId = req.user?.id

      if (!requestUserId) {
         return res.status(401).json({
            message: "Token does not include user information"
         })
      }

      const user = await User.findByPk(requestUserId)

      if (!user) {
         return res.status(401).json({
            message: "User not found"
         })
      }

      req.currentUser = {
         id: user.id,
         name: user.name,
         username: user.username
      }

      next()
   } catch (error) {
      next(error)
   }
}

module.exports = currentUser
