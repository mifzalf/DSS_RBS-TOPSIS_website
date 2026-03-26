const express = require("express")
const router = express.Router()

const authController = require("../controller/auth.controller")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")

router.post("/register", validateRequest(schemas.auth.register), authController.register)
router.post("/login", validateRequest(schemas.auth.login), authController.login)

module.exports = router
