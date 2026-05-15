const test = require("node:test")
const assert = require("node:assert/strict")

const { toBoolean, toNumber, toBoundedString, toCleanString } = require("../utils/valueCoercion")

test("toCleanString trims and rejects empty", () => {
   assert.equal(toCleanString("  hello  "), "hello")
   assert.equal(toCleanString(""), null)
   assert.equal(toCleanString(null), null)
   assert.equal(toCleanString(42), "42")
   assert.equal(toCleanString(true), "true")
})

test("toBoolean accepts canonical and localized values", () => {
   assert.equal(toBoolean("true"), true)
   assert.equal(toBoolean("FALSE"), false)
   assert.equal(toBoolean("ya"), true)
   assert.equal(toBoolean("tidak"), false)
   assert.equal(toBoolean("1"), true)
   assert.equal(toBoolean(0), false)
   assert.equal(toBoolean(true), true)
   assert.equal(toBoolean(""), null)
   assert.equal(toBoolean(null), null)
})

test("toBoolean rejects invalid", () => {
   assert.throws(() => toBoolean("maybe"))
   assert.throws(() => toBoolean(2))
})

test("toNumber accepts decimal and comma", () => {
   assert.equal(toNumber("3.14"), 3.14)
   assert.equal(toNumber("3,14"), 3.14)
   assert.equal(toNumber(0), 0)
   assert.equal(toNumber(""), null)
})

test("toNumber rejects invalid", () => {
   assert.throws(() => toNumber("abc"))
   assert.throws(() => toNumber("1.2.3"))
})

test("toBoundedString trims and limits", () => {
   assert.equal(toBoundedString("  hello  ", 10), "hello")
   assert.equal(toBoundedString("", 10), null)
   assert.throws(() => toBoundedString("abcdefghijk", 5))
})
