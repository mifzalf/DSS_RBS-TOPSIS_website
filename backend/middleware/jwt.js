const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "JWT_SECRET is not configured"
            })
        }

        const authHeader = req.header("Authorization")

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authorization token is required"
            })
        }

        const token = authHeader.replace("Bearer ", "").trim()

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = {
            id: decoded.id,
            username: decoded.username,
            name: decoded.name
        }

        next()
    } catch (error) {
        return res.status(401).json({
            message: "Token is invalid or expired"
        })
    }
}

module.exports = verifyToken
