const express = require("express")
const router = express.Router()

const userController = require("../controller/user.controller")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")

router.get("/search", validateRequest(schemas.user.search), userController.searchUsers)

module.exports = router
