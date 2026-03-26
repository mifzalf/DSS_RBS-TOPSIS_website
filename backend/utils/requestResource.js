const { NotFoundError } = require("./appError")

const getRequestResource = async ({ req, key, model, id, notFoundMessage }) => {
   if (req[key]) {
      return req[key]
   }

   const entity = await model.findByPk(id)

   if (!entity) {
      throw new NotFoundError(notFoundMessage)
   }

   req[key] = entity
   return entity
}

module.exports = {
   getRequestResource
}
