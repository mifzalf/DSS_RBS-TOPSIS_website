const test = require("node:test")
const assert = require("node:assert/strict")

const validateRequest = require("../middleware/validateRequest")

test("validateRequest sanitizes and coerces request payloads", async () => {
   const middleware = validateRequest({
      body: {
         alternative_id: { type: "integer", required: true, min: 1 },
         score: { type: "number", required: true, min: 0 },
         status_active: { type: "boolean", required: true },
         name: { type: "string", required: true, minLength: 1 }
      }
   })

   const req = {
      body: {
         alternative_id: "12",
         score: "0.75",
         status_active: "true",
         name: "  Candidate A  "
      }
   }

   await new Promise((resolve, reject) => {
      middleware(req, {}, (error) => {
         if (error) {
            reject(error)
            return
         }

         resolve()
      })
   })

   assert.deepEqual(req.body, {
      alternative_id: 12,
      score: 0.75,
      status_active: true,
      name: "Candidate A"
   })
})

test("validateRequest rejects invalid payloads with 400 response", async () => {
   const middleware = validateRequest({
      body: {
         role: { type: "enum", required: true, values: ["owner", "editor", "viewer"] }
      }
   })

   const req = {
      body: {
         role: "admin"
      }
   }

   const res = {
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
   }

   middleware(req, res, () => {
      throw new Error("next() should not be called for invalid payloads")
   })

   assert.equal(res.statusCode, 400)
   assert.equal(res.payload.message, "role must be one of: owner, editor, viewer")
})
