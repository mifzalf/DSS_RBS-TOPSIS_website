const test = require("node:test")
const assert = require("node:assert/strict")
const http = require("node:http")

const createApp = require("../app")

test("GET /health returns service status payload", async () => {
   const app = createApp({ includeRoutes: false })
   const server = http.createServer(app)

   await new Promise((resolve) => server.listen(0, resolve))

   const { port } = server.address()
   const response = await fetch(`http://127.0.0.1:${port}/health`)
   const payload = await response.json()

   await new Promise((resolve, reject) => {
      server.close((error) => {
         if (error) {
            reject(error)
            return
         }

         resolve()
      })
   })

   assert.equal(response.status, 200)
   assert.equal(payload.message, "Service is healthy")
   assert.equal(typeof payload.data.uptime, "number")
   assert.equal(typeof payload.data.timestamp, "string")
})
