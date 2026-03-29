const test = require("node:test")
const assert = require("node:assert/strict")
const http = require("node:http")
const express = require("express")

const recommendationController = require("../controller/recommendation.controller")
const recommendationService = require("../service/DSS/recommendation.service")
const Alternative = require("../models/alternative.model")

test("recommendation endpoint returns grouped data as the primary payload", async () => {
   const originalGenerateRecommendation = recommendationService.generateRecommendation
   const originalFindAll = Alternative.findAll

   recommendationService.generateRecommendation = async () => ({
      results: [
         {
            alternative_id: 1,
            category: "PKH",
            preference_score: 0.91,
            rank: 1,
            status: "ranked"
         },
         {
            alternative_id: 2,
            category: "Not eligible",
            preference_score: null,
            rank: null,
            status: "rejected"
         }
      ],
      grouped: {
         ranked_groups: [
            {
               category: "PKH",
               action_type: "assign_benefit",
               status: "ranked",
               items: [
                  {
                     alternative_id: 1,
                     preference_score: 0.91,
                     rank: 1,
                     status: "ranked"
                  }
               ]
            }
         ],
         rejected_groups: [
            {
               category: "Not eligible",
               action_type: "reject",
               status: "rejected",
               items: [
                  {
                     alternative_id: 2,
                     preference_score: null,
                     rank: null,
                     status: "rejected"
                  }
               ]
            }
         ]
      }
   })

   Alternative.findAll = async () => ([
      { id: 1, name: "Citizen A" },
      { id: 2, name: "Citizen B" }
   ])

   const app = express()
   app.post("/recommendations/decision-model/:decisionModelId", (req, res, next) => {
      req.params.decisionModelId = 10
      req.decisionModel = { id: 10, name: "Social Aid Model" }
      return recommendationController.generateRecommendation(req, res, next)
   })

   const server = http.createServer(app)
   await new Promise((resolve) => server.listen(0, resolve))

   try {
      const { port } = server.address()
      const response = await fetch(`http://127.0.0.1:${port}/recommendations/decision-model/10`, {
         method: "POST"
      })
      const payload = await response.json()

      assert.equal(response.status, 200)
      assert.ok(Array.isArray(payload.data.ranked_groups))
      assert.ok(Array.isArray(payload.data.rejected_groups))
      assert.equal(payload.data.ranked_groups[0].items[0].alternative.name, "Citizen A")
      assert.equal(payload.data.rejected_groups[0].items[0].alternative.name, "Citizen B")
      assert.equal(payload.meta.count, 2)
      assert.ok(Array.isArray(payload.meta.flat_results))
   } finally {
      recommendationService.generateRecommendation = originalGenerateRecommendation
      Alternative.findAll = originalFindAll
      await new Promise((resolve, reject) => {
         server.close((error) => {
            if (error) {
               reject(error)
               return
            }

            resolve()
         })
      })
   }
})
