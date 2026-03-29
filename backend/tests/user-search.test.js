const test = require("node:test")
const assert = require("node:assert/strict")

const userController = require("../controller/user.controller")
const User = require("../models/user.model")
const DecisionModelUser = require("../models/decision-model-user.model")

const createResponse = () => ({
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

test("searchUsers returns matching users and excludes existing decision model members", async () => {
   const originalFindAllUsers = User.findAll
   const originalFindAllMemberships = DecisionModelUser.findAll

   DecisionModelUser.findAll = async () => ([{ user_id: 2 }])
   User.findAll = async () => ([
      { id: 1, name: "Alice", username: "alice" }
   ])

   const req = {
      query: {
         q: "ali",
         decisionModelId: 1
      }
   }
   const res = createResponse()

   try {
      await userController.searchUsers(req, res)

      assert.equal(res.statusCode, 200)
      assert.equal(res.payload.message, "User search completed successfully")
      assert.deepEqual(res.payload.data, [{ id: 1, name: "Alice", username: "alice" }])
   } finally {
      User.findAll = originalFindAllUsers
      DecisionModelUser.findAll = originalFindAllMemberships
   }
})

test("searchUsers returns an empty list when query is missing", async () => {
   const req = { query: {} }
   const res = createResponse()

   await userController.searchUsers(req, res)

   assert.equal(res.statusCode, 200)
   assert.equal(res.payload.message, "User search completed successfully")
   assert.deepEqual(res.payload.data, [])
})
