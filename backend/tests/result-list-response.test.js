const test = require("node:test")
const assert = require("node:assert/strict")

const Result = require("../models/result.model")
const resultController = require("../controller/result.controller")

const buildMockRow = (raw) => ({
   ...raw,
   get({ plain }) {
      if (plain) return { ...raw }
      return raw
   }
})

const createResponseStub = () => ({
   statusCode: 200,
   payload: null,
   status(code) {
      this.statusCode = code
      return this
   },
   json(payload) {
      this.payload = payload
      return this
   }
})

test("getResultsByDecisionModel includes category name from categoryRef", async () => {
   const originalFindAll = Result.findAll

   Result.findAll = async (options) => {
      assert.equal(options.where.decision_model_id, 7)
      const includeNames = options.include.map((entry) => entry.association)
      assert.ok(includeNames.includes("alternative"))
      assert.ok(includeNames.includes("categoryRef"))

      return [
         buildMockRow({
            id: 1,
            decision_model_id: 7,
            alternative_id: 1,
            category_id: 10,
            grade_code: "high_priority",
            grade_label: "Prioritas tinggi",
            preference_score: 0.91,
            rank: 1,
            iteration: 1,
            status: "ranked",
            alternative: { id: 1, name: "Alpha" },
            categoryRef: { id: 10, code: "pkh", name: "PKH", is_ranked: true }
         }),
         buildMockRow({
            id: 2,
            decision_model_id: 7,
            alternative_id: 2,
            category_id: 11,
            grade_code: "low_priority",
            grade_label: "Prioritas rendah",
            preference_score: 0.42,
            rank: 2,
            iteration: 1,
            status: "ranked",
            alternative: { id: 2, name: "Beta" },
            categoryRef: { id: 11, code: "sembako", name: "Sembako", is_ranked: true }
         }),
         buildMockRow({
            id: 3,
            decision_model_id: 7,
            alternative_id: 3,
            category_id: 99,
            grade_code: "not_eligible",
            grade_label: "Tidak memenuhi syarat",
            preference_score: null,
            rank: null,
            iteration: 1,
            status: "rejected",
            alternative: { id: 3, name: "Gamma" },
            categoryRef: { id: 99, code: "not_eligible", name: "Tidak memenuhi syarat", is_ranked: false }
         })
      ]
   }

   const req = {
      decisionModelId: 7,
      params: {}
   }
   const res = createResponseStub()

   try {
      await resultController.getResultsByDecisionModel(req, res)
      assert.equal(res.statusCode, 200)
      assert.equal(res.payload.message, "Result list retrieved successfully")
      assert.equal(res.payload.data.length, 3)

      const [first, second, third] = res.payload.data
      assert.equal(first.category, "PKH")
      assert.equal(first.categoryRef.is_ranked, true)
      assert.equal(second.category, "Sembako")
      assert.equal(third.category, "Tidak memenuhi syarat")
      assert.equal(third.categoryRef.is_ranked, false)
   } finally {
      Result.findAll = originalFindAll
   }
})

test("getResultsByDecisionModel returns empty list without crashing", async () => {
   const originalFindAll = Result.findAll
   Result.findAll = async () => []

   const req = { decisionModelId: 99, params: {} }
   const res = createResponseStub()

   try {
      await resultController.getResultsByDecisionModel(req, res)
      assert.equal(res.statusCode, 200)
      assert.deepEqual(res.payload.data, [])
   } finally {
      Result.findAll = originalFindAll
   }
})
