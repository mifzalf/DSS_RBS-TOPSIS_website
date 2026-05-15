const crypto = require("crypto")

const { ValidationError, NotFoundError } = require("../../utils/appError")

const TOKEN_PREFIX = "imp_"

const getTtlMs = () => {
   const minutes = Number(process.env.IMPORT_PREVIEW_TTL_MINUTES)
   const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 15
   return safeMinutes * 60 * 1000
}

const store = new Map()
const timers = new Map()

const generateToken = () => {
   return TOKEN_PREFIX + crypto.randomBytes(18).toString("hex")
}

const scheduleExpiry = (token, ttlMs) => {
   const existingTimer = timers.get(token)
   if (existingTimer) clearTimeout(existingTimer)

   const timer = setTimeout(() => {
      store.delete(token)
      timers.delete(token)
   }, ttlMs)

   if (typeof timer.unref === "function") timer.unref()
   timers.set(token, timer)
}

const savePreview = (entry) => {
   if (!entry || typeof entry !== "object") {
      throw new ValidationError("Preview entry is required")
   }

   if (!entry.userId || !entry.decisionModelId || !entry.kind) {
      throw new ValidationError("Preview entry must include userId, decisionModelId, and kind")
   }

   const ttlMs = getTtlMs()
   const token = generateToken()
   const expiresAt = new Date(Date.now() + ttlMs)

   const stored = {
      ...entry,
      token,
      created_at: new Date(),
      expires_at: expiresAt
   }

   store.set(token, stored)
   scheduleExpiry(token, ttlMs)

   return { token, expires_at: expiresAt }
}

const consumePreview = ({ token, userId, decisionModelId, kind }) => {
   if (!token || typeof token !== "string" || !token.startsWith(TOKEN_PREFIX)) {
      throw new ValidationError("Invalid preview token")
   }

   const entry = store.get(token)

   if (!entry) {
      throw new NotFoundError("Preview token expired or not found. Please re-upload the file.")
   }

   if (Number(entry.userId) !== Number(userId)) {
      throw new ValidationError("Preview token does not belong to the current user")
   }

   if (Number(entry.decisionModelId) !== Number(decisionModelId)) {
      throw new ValidationError("Preview token does not belong to this decision model")
   }

   if (kind && entry.kind !== kind) {
      throw new ValidationError("Preview token kind mismatch")
   }

   const existingTimer = timers.get(token)
   if (existingTimer) {
      clearTimeout(existingTimer)
      timers.delete(token)
   }
   store.delete(token)

   return entry
}

const peekPreview = (token) => store.get(token) || null

const clear = () => {
   for (const timer of timers.values()) clearTimeout(timer)
   store.clear()
   timers.clear()
}

module.exports = {
   savePreview,
   consumePreview,
   peekPreview,
   clear,
   TOKEN_PREFIX
}
