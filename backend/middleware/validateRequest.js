const { ValidationError } = require("../utils/appError")

const isEmpty = (value) => value === undefined || value === null || value === ""

const validators = {
   string(value, rule, field) {
      if (typeof value !== "string") {
         throw new ValidationError(`${field} must be a string`)
      }

      const nextValue = rule.trim === false ? value : value.trim()

      if (!rule.allowEmpty && nextValue.length === 0) {
         throw new ValidationError(`${field} must not be empty`)
      }

      if (rule.minLength && nextValue.length < rule.minLength) {
         throw new ValidationError(`${field} must be at least ${rule.minLength} characters long`)
      }

      if (rule.maxLength && nextValue.length > rule.maxLength) {
         throw new ValidationError(`${field} must be at most ${rule.maxLength} characters long`)
      }

      return nextValue
   },
   integer(value, rule, field) {
      const parsed = Number(value)

      if (!Number.isInteger(parsed)) {
         throw new ValidationError(`${field} must be an integer`)
      }

      if (rule.min !== undefined && parsed < rule.min) {
         throw new ValidationError(`${field} must be greater than or equal to ${rule.min}`)
      }

      if (rule.max !== undefined && parsed > rule.max) {
         throw new ValidationError(`${field} must be less than or equal to ${rule.max}`)
      }

      return parsed
   },
   number(value, rule, field) {
      const parsed = Number(value)

      if (!Number.isFinite(parsed)) {
         throw new ValidationError(`${field} must be a valid number`)
      }

      if (rule.min !== undefined && parsed < rule.min) {
         throw new ValidationError(`${field} must be greater than or equal to ${rule.min}`)
      }

      if (rule.max !== undefined && parsed > rule.max) {
         throw new ValidationError(`${field} must be less than or equal to ${rule.max}`)
      }

      return parsed
   },
   boolean(value, rule, field) {
      if (typeof value === "boolean") {
         return value
      }

      if (value === "true") return true
      if (value === "false") return false

      throw new ValidationError(`${field} must be a boolean`)
   },
   enum(value, rule, field) {
      if (!rule.values.includes(value)) {
         throw new ValidationError(`${field} must be one of: ${rule.values.join(", ")}`)
      }

      return value
   }
}

const sanitizeSection = (source, schema) => {
   const result = { ...source }

   for (const [field, rule] of Object.entries(schema)) {
      const value = source[field]

      if (isEmpty(value)) {
         if (rule.required) {
            throw new ValidationError(`${field} is required`)
         }

         continue
      }

      const validator = validators[rule.type]

      if (!validator) {
         throw new ValidationError(`Unsupported validator type for ${field}`)
      }

      result[field] = validator(value, rule, field)
   }

   return result
}

const validateRequest = ({ body, params, query } = {}) => {
   return (req, res, next) => {
      try {
         if (body) {
            req.body = sanitizeSection(req.body || {}, body)
         }

         if (params) {
            req.params = sanitizeSection(req.params || {}, params)
         }

         if (query) {
            req.query = sanitizeSection(req.query || {}, query)
         }

         next()
      } catch (error) {
         if (error.status) {
            return res.status(error.status).json({ message: error.message })
         }

         return res.status(500).json({ message: error.message })
      }
   }
}

module.exports = validateRequest
