const test = require("node:test")
const assert = require("node:assert/strict")

const { normalizeCategoryPayload, normalizeSlotCount } = require("../service/assistance-category.service")

test("normalizeSlotCount returns null for ranked categories with empty slot", () => {
   const result = normalizeSlotCount({
      isRanked: true,
      slotCount: "",
      currentSlotCount: null
   })

   assert.equal(result, null)
})

test("normalizeSlotCount keeps numeric slot for ranked categories", () => {
   const result = normalizeSlotCount({
      isRanked: true,
      slotCount: 10,
      currentSlotCount: null
   })

   assert.equal(result, 10)
})

test("normalizeSlotCount clears slot for rejected categories", () => {
   const result = normalizeSlotCount({
      isRanked: false,
      slotCount: 10,
      currentSlotCount: 10
   })

   assert.equal(result, null)
})

test("normalizeCategoryPayload preserves unlimited slot for ranked categories", () => {
   const payload = normalizeCategoryPayload({
      is_ranked: true,
      slot_count: null,
      allocation_order: null,
      accepts_overflow: false
   })

   assert.equal(payload.slot_count, null)
   assert.equal(payload.allocation_order, null)
   assert.equal(payload.accepts_overflow, false)
})

test("normalizeCategoryPayload removes slot when category becomes rejected", () => {
   const payload = normalizeCategoryPayload(
      { is_ranked: false },
      { is_ranked: true, slot_count: 5, allocation_order: 2, accepts_overflow: true }
   )

   assert.equal(payload.slot_count, null)
   assert.equal(payload.allocation_order, null)
   assert.equal(payload.accepts_overflow, false)
})

test("normalizeCategoryPayload keeps allocation order and overflow on ranked categories", () => {
   const payload = normalizeCategoryPayload({
      is_ranked: true,
      slot_count: 4,
      allocation_order: 3,
      accepts_overflow: true
   })

   assert.equal(payload.slot_count, 4)
   assert.equal(payload.allocation_order, 3)
   assert.equal(payload.accepts_overflow, true)
})
