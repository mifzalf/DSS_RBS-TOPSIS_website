const { toCleanString } = require("../../../utils/valueCoercion")

const NAME_MAX_LENGTH = 150
const DESCRIPTION_MAX_LENGTH = 5000

const normalizeNameKey = (value) => String(value || "").trim().toLowerCase()

const validateRow = (rawRow) => {
   const errors = []
   const name = toCleanString(rawRow.values.name)
   const description = toCleanString(rawRow.values.description)

   if (!name) {
      errors.push({ field: "name", message: "Name is required" })
   } else if (name.length > NAME_MAX_LENGTH) {
      errors.push({ field: "name", message: `Name must be at most ${NAME_MAX_LENGTH} characters` })
   }

   if (description && description.length > DESCRIPTION_MAX_LENGTH) {
      errors.push({ field: "description", message: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters` })
   }

   return {
      row_number: rawRow.row_number,
      errors,
      data: {
         name,
         description: description || null
      }
   }
}

const detectInFileDuplicates = (validatedRows) => {
   const map = new Map()

   for (const row of validatedRows) {
      const name = row.data.name
      if (!name || row.errors.length) continue

      const key = normalizeNameKey(name)

      if (!map.has(key)) {
         map.set(key, [])
      }
      map.get(key).push(row.row_number)
   }

   const duplicateRowNumbers = new Set()

   for (const rowNumbers of map.values()) {
      if (rowNumbers.length > 1) {
         for (const rowNumber of rowNumbers.slice(1)) {
            duplicateRowNumbers.add(rowNumber)
         }
      }
   }

   for (const row of validatedRows) {
      if (duplicateRowNumbers.has(row.row_number)) {
         row.errors.push({ field: "name", message: "Duplicate name within the file" })
      }
   }

   return validatedRows
}

module.exports = {
   validateRow,
   detectInFileDuplicates,
   normalizeNameKey,
   NAME_MAX_LENGTH,
   DESCRIPTION_MAX_LENGTH
}
