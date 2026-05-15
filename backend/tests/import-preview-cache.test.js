const test = require("node:test")
const assert = require("node:assert/strict")

const cache = require("../service/import/preview-cache.service")

test("savePreview returns a token and respects TTL", () => {
   cache.clear()

   const { token, expires_at } = cache.savePreview({
      userId: 1,
      decisionModelId: 10,
      kind: "alternatives",
      preview: { foo: "bar" },
      mode: "upsert"
   })

   assert.ok(typeof token === "string" && token.startsWith(cache.TOKEN_PREFIX))
   assert.ok(expires_at instanceof Date)
   assert.deepEqual(cache.peekPreview(token).preview, { foo: "bar" })
})

test("consumePreview rejects mismatched user", () => {
   cache.clear()

   const { token } = cache.savePreview({
      userId: 1,
      decisionModelId: 10,
      kind: "alternatives",
      preview: {},
      mode: "upsert"
   })

   assert.throws(() => {
      cache.consumePreview({ token, userId: 2, decisionModelId: 10, kind: "alternatives" })
   }, /Preview token does not belong to the current user/)
})

test("consumePreview rejects mismatched decision model", () => {
   cache.clear()

   const { token } = cache.savePreview({
      userId: 1,
      decisionModelId: 10,
      kind: "alternatives",
      preview: {},
      mode: "upsert"
   })

   assert.throws(() => {
      cache.consumePreview({ token, userId: 1, decisionModelId: 11, kind: "alternatives" })
   }, /Preview token does not belong to this decision model/)
})

test("consumePreview rejects unknown kind", () => {
   cache.clear()

   const { token } = cache.savePreview({
      userId: 1,
      decisionModelId: 10,
      kind: "alternatives",
      preview: {},
      mode: "upsert"
   })

   assert.throws(() => {
      cache.consumePreview({ token, userId: 1, decisionModelId: 10, kind: "topsis_evaluations" })
   }, /Preview token kind mismatch/)
})

test("consumePreview is single-use", () => {
   cache.clear()

   const { token } = cache.savePreview({
      userId: 1,
      decisionModelId: 10,
      kind: "alternatives",
      preview: { value: 1 },
      mode: "upsert"
   })

   const first = cache.consumePreview({ token, userId: 1, decisionModelId: 10, kind: "alternatives" })
   assert.deepEqual(first.preview, { value: 1 })

   assert.throws(() => {
      cache.consumePreview({ token, userId: 1, decisionModelId: 10, kind: "alternatives" })
   }, /Preview token expired or not found/)
})

test("invalid tokens are rejected immediately", () => {
   cache.clear()
   assert.throws(() => {
      cache.consumePreview({ token: "garbage", userId: 1, decisionModelId: 10, kind: "alternatives" })
   }, /Invalid preview token/)
})
