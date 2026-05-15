const TRUTHY_VALUES = new Set(["true", "1", "yes", "y", "ya"])
const FALSY_VALUES = new Set(["false", "0", "no", "n", "tidak"])

const toCleanString = (value) => {
   if (value === null || value === undefined) return null
   if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed.length === 0 ? null : trimmed
   }
   if (typeof value === "number" && Number.isFinite(value)) return String(value)
   if (typeof value === "boolean") return value ? "true" : "false"
   if (value instanceof Date) return value.toISOString()
   return null
}

const toBoolean = (value) => {
   if (typeof value === "boolean") return value
   if (typeof value === "number") {
      if (value === 1) return true
      if (value === 0) return false
      throw new Error("Value must be true/false or 0/1")
   }

   const text = toCleanString(value)
   if (text === null) return null

   const lowered = text.toLowerCase()

   if (TRUTHY_VALUES.has(lowered)) return true
   if (FALSY_VALUES.has(lowered)) return false

   throw new Error("Value must be one of: true, false, 1, 0, yes, no, ya, tidak")
}

const toNumber = (value) => {
   if (typeof value === "number" && Number.isFinite(value)) return value
   const text = toCleanString(value)
   if (text === null) return null

   const normalized = text.replace(/,/g, ".")
   const parsed = Number(normalized)

   if (!Number.isFinite(parsed)) {
      throw new Error("Value must be a valid number")
   }

   return parsed
}

const toBoundedString = (value, maxLength = 255) => {
   const text = toCleanString(value)
   if (text === null) return null

   if (text.length > maxLength) {
      throw new Error(`Value exceeds ${maxLength} characters`)
   }

   return text
}

module.exports = {
   toCleanString,
   toBoolean,
   toNumber,
   toBoundedString
}
