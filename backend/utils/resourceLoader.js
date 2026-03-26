const createError = require("http-errors")

const loadByPrimaryKey = async ({
   req,
   model,
   id,
   requestKey,
   notFoundMessage
}) => {
   const entity = await model.findByPk(id)

   if (!entity) {
      throw createError(404, notFoundMessage)
   }

   if (requestKey) {
      req[requestKey] = entity
   }

   return entity
}

module.exports = {
   loadByPrimaryKey
}
