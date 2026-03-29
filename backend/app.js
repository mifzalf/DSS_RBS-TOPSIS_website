const createError = require("http-errors")
const express = require("express")
const logger = require("morgan")
const cors = require("cors")
const helmet = require("helmet")

const buildCorsOptions = () => {
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (!allowedOrigins.length) {
    return {}
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(createError(403, "Origin is not allowed by CORS"))
    }
  }
}

const createApp = ({ includeRoutes = true } = {}) => {
  const app = express()
  const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "1mb"

  app.disable("x-powered-by")
  app.set("trust proxy", process.env.TRUST_PROXY === "true")

  app.use(cors(buildCorsOptions()))
  app.use(helmet())
  app.use(logger("dev"))

  app.use(express.json({ limit: requestBodyLimit }))
  app.use(express.urlencoded({ extended: false, limit: requestBodyLimit }))

  app.get("/health", (req, res) => {
    res.status(200).json({
      message: "Service is healthy",
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    })
  })

  if (includeRoutes) {
    const authRouter = require("./routes/auth.route")
    const decisionModelRouter = require("./routes/decisionModel.route")
    const criteriaRouter = require("./routes/criteria.route")
    const alternativesRouter = require("./routes/alternatives.route")
    const evaluationRouter = require("./routes/evaluations.route")
    const ruleRouter = require("./routes/rules.route")
    const ruleVariableRouter = require("./routes/rule-variables.route")
    const ruleEvaluationRouter = require("./routes/rule-evaluations.route")
    const resultsRouter = require("./routes/results.route")
    const recommendationRouter = require("./routes/recommendation.route")
    const currentUser = require("./middleware/currentUser")
    const verifyToken = require("./middleware/jwt")

    app.use("/auth", authRouter)

    app.use(verifyToken)
    app.use(currentUser)

    app.use("/decision-model", decisionModelRouter)
    app.use("/criteria", criteriaRouter)
    app.use("/alternatives", alternativesRouter)
    app.use("/evaluations", evaluationRouter)
    app.use("/rules", ruleRouter)
    app.use("/rule-variables", ruleVariableRouter)
    app.use("/rule-evaluations", ruleEvaluationRouter)
    app.use("/results", resultsRouter)
    app.use("/recommendations", recommendationRouter)
  }

  app.use((req, res, next) => {
    next(createError(404))
  })

  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(err)
    }

    res.status(err.status || 500).json({
      message: err.message
    })
  })

  return app
}

module.exports = createApp
