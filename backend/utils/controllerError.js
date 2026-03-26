module.exports = (res, error) => {
   if (error?.status) {
      return res.status(error.status).json({
         message: error.message
      })
   }

   if (error?.name === "SequelizeValidationError") {
      return res.status(400).json({
         message: error.errors?.[0]?.message || error.message
      })
   }

   if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
         message: error.errors?.[0]?.message || error.message
      })
   }

   return res.status(500).json({
      message: error.message
   })
}
