const SubCriteria = require("../models/sub-criteria.model")
const { ValidationError } = require("../utils/appError")

const createSubCriteria = async ({ criteria, criteriaIdFromBody, label, value }) => {
   if (criteriaIdFromBody && Number(criteriaIdFromBody) !== Number(criteria.id)) {
      throw new ValidationError("criteria_id must match the target criteria")
   }

   return SubCriteria.create({
      criteria_id: criteria.id,
      label,
      value
   })
}

const updateSubCriteria = async (subCriteria, payload) => {
   await subCriteria.update(payload)
   return subCriteria
}

module.exports = {
   createSubCriteria,
   updateSubCriteria
}
