require('dotenv').config()

const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
const helmet = require('helmet')

const { db, configureDB } = require('./config/database')

require('./models/association')

// const authRouter = require('./routes/auth')
// const decisionModelRouter = require('./routes/decisionModel')
// const criteriaRouter = require('./routes/criteria')
// const subCriteriaRouter = require('./routes/subCriteria')
// const alternativeRouter = require('./routes/alternative')
// const evaluationRouter = require('./routes/evaluation')
// const ruleRouter = require('./routes/rule')
// const recommendationRouter = require('./routes/recommendation')

// const verifyToken = require('./middleware/jwt')

const app = express()

app.use(cors())
app.use(helmet())
app.use(logger('dev'))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(express.static(path.join(__dirname, 'public')));

(async () => {
  try {
    await configureDB()

    const RESET_DB = false

    if (RESET_DB) {
      await db.query('SET FOREIGN_KEY_CHECKS = 0')
      await db.sync({ force: true })
      await db.query('SET FOREIGN_KEY_CHECKS = 1')
      console.log("Database recreated")
    } else {
      await db.sync()
      console.log("Database synced")
    }

  } catch (error) {
    console.error(error)
  }
})()

// app.use('/auth', authRouter)

// app.use(verifyToken)

// app.use('/decision-model', decisionModelRouter)
// app.use('/criteria', criteriaRouter)
// app.use('/sub-criteria', subCriteriaRouter)
// app.use('/alternatives', alternativeRouter)
// app.use('/evaluations', evaluationRouter)
// app.use('/rules', ruleRouter)
// app.use('/recommendation', recommendationRouter)

app.use(function(req,res,next){
  next(createError(404))
})

app.use(function(err,req,res,next){
  res.status(err.status || 500).json({
    message: err.message
  })
})

module.exports = app