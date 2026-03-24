const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const User = require("../models/users")

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h"

const buildTokenPayload = (user) => ({
   id: user.id,
   username: user.username,
   name: user.name
})

const signAccessToken = (payload) => {
   if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET belum dikonfigurasi")
   }

   return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
   })
}

const sanitizeUser = (user) => ({
   id: user.id,
   name: user.name,
   username: user.username
})

exports.register = async (req, res) => {
   try {
      const { name, username, password } = req.body

      if (!name?.trim() || !username?.trim() || !password?.trim()) {
         return res.status(400).json({
            message: "Nama, username, dan password wajib diisi"
         })
      }

      const exists = await User.findOne({ where: { username } })

      if (exists) {
         return res.status(409).json({
            message: "Username sudah digunakan"
         })
      }

      const hashed = await bcrypt.hash(password, 10)

      const newUser = await User.create({
         name,
         username,
         password: hashed,
         created_at: new Date()
      })

      const token = signAccessToken(buildTokenPayload(newUser))

      return res.status(201).json({
         message: "Registrasi berhasil",
         data: sanitizeUser(newUser),
         token,
         expiresIn: JWT_EXPIRES_IN
      })
   } catch (error) {
      return res.status(500).json({
         message: error.message
      })
   }
}

exports.login = async (req, res) => {
   try {
   	const { username, password } = req.body

      if (!username?.trim() || !password?.trim()) {
         return res.status(400).json({
            message: "Username dan password wajib diisi"
         })
      }

      const user = await User.findOne({ where: { username } })

      if (!user) {
         return res.status(401).json({
            message: "Username atau password salah"
         })
      }

      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
         return res.status(401).json({
            message: "Username atau password salah"
         })
      }

      const token = signAccessToken(buildTokenPayload(user))

      return res.json({
         message: "Login berhasil",
         data: sanitizeUser(user),
         token,
         expiresIn: JWT_EXPIRES_IN
      })
   } catch (error) {
      return res.status(500).json({
         message: error.message
      })
   }
}
