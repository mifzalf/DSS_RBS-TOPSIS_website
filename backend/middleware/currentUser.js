const User = require("../models/users")

const currentUser = async (req, res, next) => {
   try {
      const requestUserId = req.user?.id

      if (!requestUserId) {
         return res.status(401).json({
            message: "Token tidak menyediakan informasi user"
         })
      }

      const user = await User.findByPk(requestUserId)

      if (!user) {
         return res.status(401).json({
            message: "User tidak ditemukan"
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
