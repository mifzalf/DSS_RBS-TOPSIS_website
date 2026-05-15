const { toBoolean, toNumber, toBoundedString, toCleanString } = require("../../../utils/valueCoercion")
const { RULE_VARIABLE_TYPES } = require("../../../constants/rule-variable-types")

const ALTERNATIVE_HEADER = "alternative_name"

const normalizeKey = (value) => String(value || "").trim().toLowerCase()

const matchVariableForHeader = (header, variables) => {
   const key = normalizeKey(header)
   if (!key) return null
   const byCode = variables.find((variable) => normalizeKey(variable.code) === key)
   if (byCode) return byCode
   return variables.find((variable) => normalizeKey(variable.name) === key) || null
}

const coerceCellValue = ({ rawValue, variable }) => {
   const cleaned = toCleanString(rawValue)
   if (cleaned === null) return { isEmpty: true, value: null }

   try {
      switch (variable.value_type) {
         case RULE_VARIABLE_TYPES.BOOLEAN: {
            const value = toBoolean(rawValue)
            return { isEmpty: false, value, kind: RULE_VARIABLE_TYPES.BOOLEAN }
         }
         case RULE_VARIABLE_TYPES.NUMBER: {
            const value = toNumber(rawValue)
            return { isEmpty: false, value, kind: RULE_VARIABLE_TYPES.NUMBER }
         }
         case RULE_VARIABLE_TYPES.STRING:
         default: {
            const value = toBoundedString(rawValue, 255)
            return { isEmpty: false, value, kind: RULE_VARIABLE_TYPES.STRING }
         }
      }
   } catch (error) {
      return { isEmpty: false, error: error.message }
   }
}

const buildEvaluationPayload = ({ alternativeId, variable, coerced }) => {
   const payload = {
      alternative_id: alternativeId,
      rule_variable_id: variable.id,
      value_boolean: null,
      value_number: null,
      value_string: null
   }

   switch (coerced.kind) {
      case RULE_VARIABLE_TYPES.BOOLEAN:
         payload.value_boolean = coerced.value
         break
      case RULE_VARIABLE_TYPES.NUMBER:
         payload.value_number = coerced.value
         break
      case RULE_VARIABLE_TYPES.STRING:
      default:
         payload.value_string = coerced.value
         break
   }

   return payload
}

const valuesEqual = ({ existing, payload }) => {
   if (!existing) return false
   return (
      existing.value_boolean === payload.value_boolean
      && (existing.value_number === payload.value_number || (existing.value_number === null && payload.value_number === null))
      && (existing.value_string === payload.value_string || (!existing.value_string && !payload.value_string))
   )
}

const validateRow = ({ row, alternativeMap, headerMappings }) => {
   const errors = []
   const cells = []

   const rawAlternativeName = toCleanString(row.values[ALTERNATIVE_HEADER])

   if (!rawAlternativeName) {
      errors.push({ field: ALTERNATIVE_HEADER, message: "alternative_name is required" })
   }

   const alternative = rawAlternativeName ? alternativeMap.get(normalizeKey(rawAlternativeName)) : null

   if (rawAlternativeName && !alternative) {
      errors.push({ field: ALTERNATIVE_HEADER, message: `Alternative "${rawAlternativeName}" not found in this decision model` })
   }

   for (const mapping of headerMappings) {
      if (mapping.header === ALTERNATIVE_HEADER) continue

      if (!mapping.variable) {
         const rawValue = row.values[mapping.header]
         const cleaned = toCleanString(rawValue)
         cells.push({
            header: mapping.header,
            variable_id: null,
            value_type: null,
            payload: null,
            errors: cleaned === null ? [] : [{ message: `Header "${mapping.header}" does not match any active rule variable` }],
            action: "skip",
            reason: cleaned === null ? "empty" : "unknown_variable"
         })
         continue
      }

      const rawValue = row.values[mapping.header]
      const coerced = coerceCellValue({ rawValue, variable: mapping.variable })

      if (coerced.isEmpty) {
         cells.push({
            header: mapping.header,
            variable_id: mapping.variable.id,
            value_type: mapping.variable.value_type,
            payload: null,
            errors: [],
            action: "skip",
            reason: "empty"
         })
         continue
      }

      if (coerced.error) {
         cells.push({
            header: mapping.header,
            variable_id: mapping.variable.id,
            value_type: mapping.variable.value_type,
            payload: null,
            errors: [{ message: `${mapping.header}: ${coerced.error}` }],
            action: "skip",
            reason: "invalid_value"
         })
         continue
      }

      const payload = buildEvaluationPayload({
         alternativeId: alternative?.id || null,
         variable: mapping.variable,
         coerced
      })

      cells.push({
         header: mapping.header,
         variable_id: mapping.variable.id,
         value_type: mapping.variable.value_type,
         payload,
         errors: [],
         action: "set",
         reason: null
      })
   }

   return {
      row_number: row.row_number,
      alternative_name: rawAlternativeName,
      alternative_id: alternative?.id || null,
      errors,
      cells
   }
}

module.exports = {
   matchVariableForHeader,
   coerceCellValue,
   buildEvaluationPayload,
   valuesEqual,
   validateRow,
   normalizeKey,
   ALTERNATIVE_HEADER
}
