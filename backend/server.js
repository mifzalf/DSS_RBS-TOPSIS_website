require("dotenv").config()

const http = require("http")

const createApp = require("./app")
const { db, configureDB } = require("./config/database")

require("./models/associations")

const normalizePort = (value) => {
   const port = parseInt(value, 10)

   if (Number.isNaN(port)) {
      return value
   }

   if (port >= 0) {
      return port
   }

   return false
}

const syncDatabase = async () => {
   await configureDB()

   const resetDb = process.env.RESET_DB === "true"

   if (resetDb) {
      await db.query("SET FOREIGN_KEY_CHECKS = 0")
      await db.sync({ force: true })
      await db.query("SET FOREIGN_KEY_CHECKS = 1")
      console.log("Database recreated")
      return
   }

   await db.sync()
   console.log("Database synced")
}

const startServer = async () => {
   await syncDatabase()

   const app = createApp()
   const port = normalizePort(process.env.PORT || "3000")

   app.set("port", port)

   const server = http.createServer(app)

   server.on("error", (error) => {
      if (error.syscall !== "listen") {
         throw error
      }

      const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`

      switch (error.code) {
         case "EACCES":
            console.error(`${bind} requires elevated privileges`)
            process.exit(1)
            break
         case "EADDRINUSE":
            console.error(`${bind} is already in use`)
            process.exit(1)
            break
         default:
            throw error
      }
   })

   server.on("listening", () => {
      const address = server.address()
      const bind = typeof address === "string" ? `pipe ${address}` : `port ${address.port}`
      console.log(`Listening on ${bind}`)
   })

   server.listen(port)

   const shutdown = async (signal) => {
      console.log(`Received ${signal}, shutting down gracefully`)

      server.close(async () => {
         try {
            await db.close()
            process.exit(0)
         } catch (error) {
            console.error("Failed to close database connection", error)
            process.exit(1)
         }
      })
   }

   process.on("SIGINT", () => {
      shutdown("SIGINT")
   })

   process.on("SIGTERM", () => {
      shutdown("SIGTERM")
   })

   return server
}

if (require.main === module) {
   startServer().catch((error) => {
      console.error("Failed to start server", error)
      process.exit(1)
   })
}

module.exports = {
   startServer,
   syncDatabase,
   normalizePort
}
