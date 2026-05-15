const { toCleanString } = require("../../../utils/valueCoercion")

const HEADER_PATTERN = /^(?<code>[^()]+?)\s*\((?<name>.+)\)\s*$/
const ALTERNATIVE_HEADER = "alternative_name"

const normalizeKey = (value) => String(value || "").trim().toLowerCase()

const splitHeader = (label) => {
   if (!label) return null
   const text = String(label).trim()
   const match = text.match(HEADER_PATTERN)

   if (match) {
      return {
         code: match.groups.code.trim(),
         name: match.groups.name.trim(),
         raw: text
      }
   }

   return { code: text, name: text, raw: text }
}

const matchCriteriaForHeader = (header, criteriaList) => {
   const parsed = splitHeader(header)
   if (!parsed) return null

   const codeKey = normalizeKey(parsed.code)
   const nameKey = normalizeKey(parsed.name)

   if (codeKey) {
      const byCode = criteriaList.find((item) => normalizeKey(item.code) === codeKey)
      if (byCode) return byCode
   }

   if (nameKey) {
      const byName = criteriaList.find((item) => normalizeKey(item.name) === nameKey)
      if (byName) return byName
   }

   return null
}

const matchSubCriteriaForLabel = (label, subCriteria) => {
   const key = normalizeKey(label)
   if (!key) return null
   return subCriteria.find((sub) => normalizeKey(sub.label) === key) || null
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

      const rawValue = row.values[mapping.header]
      const cellValue = toCleanString(rawValue)

      if (cellValue === null) {
         cells.push({
            header: mapping.header,
            criteria_id: mapping.criteria?.id || null,
            sub_criteria_id: null,
            sub_criteria_label: null,
            errors: [],
            action: "skip",
            reason: "empty"
         })
         continue
      }

      if (!mapping.criteria) {
         cells.push({
            header: mapping.header,
            criteria_id: null,
            sub_criteria_id: null,
            sub_criteria_label: cellValue,
            errors: [{ message: `Header "${mapping.header}" does not match any active criteria` }],
            action: "skip",
            reason: "unknown_criteria"
         })
         continue
      }

      const subCriteria = matchSubCriteriaForLabel(cellValue, mapping.criteria.sub_criteria || [])

      if (!subCriteria) {
         cells.push({
            header: mapping.header,
            criteria_id: mapping.criteria.id,
            sub_criteria_id: null,
            sub_criteria_label: cellValue,
            errors: [{ message: `Sub-criteria "${cellValue}" not found for criteria "${mapping.criteria.name}"` }],
            action: "skip",
            reason: "unknown_sub_criteria"
         })
         continue
      }

      cells.push({
         header: mapping.header,
         criteria_id: mapping.criteria.id,
         sub_criteria_id: subCriteria.id,
         sub_criteria_label: subCriteria.label,
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
   matchCriteriaForHeader,
   matchSubCriteriaForLabel,
   splitHeader,
   validateRow,
   normalizeKey,
   ALTERNATIVE_HEADER
}
