const sendSuccess = (res, { message, data = null, meta, status = 200 }) => {
   const payload = { message }

   if (data !== undefined) {
      payload.data = data
   }

   if (meta !== undefined) {
      payload.meta = meta
   }

   return res.status(status).json(payload)
}

module.exports = {
   sendSuccess
}
