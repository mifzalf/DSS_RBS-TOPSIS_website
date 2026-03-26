const test = require("node:test")
const assert = require("node:assert/strict")

const topsis = require("../service/DSS/topsis.service")

test("calculateTopsis ranks alternatives by descending score", () => {
   const matrix = [
      [5, 3],
      [4, 4],
      [3, 5]
   ]

   const criteria = [
      { weight: 0.6, type: "benefit" },
      { weight: 0.4, type: "cost" }
   ]

   const result = topsis.calculateTopsis(matrix, criteria)

   assert.equal(result.length, 3)
   assert.deepEqual(result.map((item) => item.rank), [1, 2, 3])
   assert.ok(result[0].score >= result[1].score)
   assert.ok(result[1].score >= result[2].score)
})

test("calculateTopsis returns empty array for empty inputs", () => {
   assert.deepEqual(topsis.calculateTopsis([], []), [])
   assert.deepEqual(topsis.calculateTopsis([[1, 2]], []), [])
   assert.deepEqual(topsis.calculateTopsis([], [{ weight: 1, type: "benefit" }]), [])
})
