const ruleEngine = require("./rule-engine.service")
const matrixBuilder = require("./matrix-builder.service")
const topsis = require("./topsis.service")
const gradingService = require("../grading.service")

const { db } = require("../../config/database")
const Result = require("../../models/result.model")
const AssistanceCategory = require("../../models/assistance-category.model")
const Rule = require("../../models/rule.model")

class RecommendationGenerationError extends Error {
   constructor(message, status = 400) {
      super(message)
      this.name = "RecommendationGenerationError"
      this.status = status
   }
}

const validateAlternativeAvailability = (matrixData) => {
   if (!matrixData.alternatives.length) {
      throw new RecommendationGenerationError("No active alternatives found for this decision model")
   }
}

const validateRankedGroupInput = (matrixData, category) => {
    if (!matrixData.criteria.length) {
      throw new RecommendationGenerationError(`No active criteria found for category ${category}`)
    }
}

const groupRuleResultsByCategory = (ruleResults) => {
   return ruleResults.reduce((groups, item) => {
      const category = item.category || "Unclassified"

      if (!groups[category]) {
         groups[category] = {
             categoryId: item.category_id || null,
             category,
             isRanked: item.is_ranked !== false,
             actionType: item.action_type || null,
             slotCount: item.slot_count ?? null,
             allocationOrder: item.allocation_order ?? null,
             acceptsOverflow: Boolean(item.accepts_overflow),
             items: []
          }
       }

      groups[category].items.push(item)

      return groups
   }, {})
}

const buildAlternativeLookup = (alternatives) => {
   return new Map(alternatives.map(item => [item.id, item]))
}

const normalizeSlotCount = (slotCount) => {
   if (slotCount === undefined || slotCount === null || slotCount === "") return null
   const parsed = Number(slotCount)
   return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

const applySlotStatus = ({ item, slotCount }) => {
   const normalizedSlotCount = normalizeSlotCount(slotCount)

   if (normalizedSlotCount === null) {
      return {
         slot_status: "within_slot",
         slot_position: item.rank
      }
   }

   if (item.rank <= normalizedSlotCount) {
      return {
         slot_status: "within_slot",
         slot_position: item.rank
      }
   }

   return {
      slot_status: "outside_slot",
      slot_position: null
   }
}

const generateRankedGroupResults = async ({ decisionModelId, categoryGroup, items }) => {
   const sourceItems = items || categoryGroup.items
   const alternativeIds = sourceItems.map(item => item.alternative_id)
   const matrixData = await matrixBuilder.buildMatrixForAlternatives({
      decisionModelId,
      alternativeIds
   })

   validateRankedGroupInput(matrixData, categoryGroup.category)

   const ranking = topsis.calculateTopsis(matrixData.matrix, matrixData.criteria)
   const sourceByAlternativeId = new Map(sourceItems.map((item) => [item.alternative_id, item]))

   return ranking.map((item) => {
      const alternative = matrixData.alternatives[item.alternative]
      const slot = applySlotStatus({ item, slotCount: categoryGroup.slotCount })
      const source = sourceByAlternativeId.get(alternative.id) || {}

      return {
         decision_model_id: decisionModelId,
         alternative_id: alternative.id,
         category_id: categoryGroup.categoryId,
         origin_category_id: source.origin_category_id ?? categoryGroup.categoryId,
         category: categoryGroup.category,
         action_type: categoryGroup.actionType,
         allocation_source: source.allocation_source || "direct",
         slot_count: categoryGroup.slotCount ?? null,
         slot_status: slot.slot_status,
         slot_position: slot.slot_position,
         grade_code: null,
         grade_label: null,
         preference_score: item.score,
         rank: item.rank,
         status: "ranked"
      }
   })
}

const generateRejectedGroupResults = ({ decisionModelId, categoryGroup }) => {
   return categoryGroup.items.map((item) => ({
      decision_model_id: decisionModelId,
      alternative_id: item.alternative_id,
      category_id: categoryGroup.categoryId,
      origin_category_id: categoryGroup.categoryId,
      category: categoryGroup.category,
      action_type: categoryGroup.actionType,
      allocation_source: "rejected",
      slot_count: null,
      slot_status: "not_applicable",
      slot_position: null,
      grade_code: null,
      grade_label: null,
      preference_score: null,
      rank: null,
      status: "rejected"
   }))
}

const serializeGroupedResponse = (results, alternatives) => {
   const alternativeLookup = buildAlternativeLookup(alternatives)
   const grouped = results.reduce((accumulator, result) => {
      const categoryKey = result.category || "Unclassified"
      const key = `${result.status}:${categoryKey}`

      if (!accumulator[key]) {
         accumulator[key] = {
            category_id: result.category_id,
            category: categoryKey,
            action_type: result.action_type || null,
            slot_count: result.slot_count ?? null,
            status: result.status,
            items: []
         }
      }

      accumulator[key].items.push({
         alternative_id: result.alternative_id,
         category_id: result.category_id,
         origin_category_id: result.origin_category_id ?? null,
         alternative: alternativeLookup.get(result.alternative_id) || null,
         grade_code: result.grade_code,
         grade_label: result.grade_label,
         preference_score: result.preference_score,
         rank: result.rank,
          status: result.status,
         allocation_source: result.allocation_source || "direct",
         slot_status: result.slot_status || "not_applicable",
         slot_position: result.slot_position ?? null
      })

      return accumulator
   }, {})

   const groups = Object.values(grouped).map((group) => {
      const items = [...group.items].sort((left, right) => {
         if (left.rank === null && right.rank === null) return left.alternative_id - right.alternative_id
         if (left.rank === null) return 1
         if (right.rank === null) return -1
         return left.rank - right.rank
      })

      return {
         ...group,
         items
      }
   })

   return {
      ranked_groups: groups.filter(group => group.status === "ranked"),
      rejected_groups: groups.filter(group => group.status === "rejected")
   }
}

const loadRankedCategoryConfigs = async (decisionModelId) => {
   const categories = await AssistanceCategory.findAll({
      where: {
         decision_model_id: decisionModelId,
         status_active: true,
         is_ranked: true
      },
      include: [
         {
            model: Rule,
            as: "rules",
            attributes: ["id", "status_active", "logic_type"],
            required: false
         }
      ]
   })

   return categories
      .map((category) => ({
         categoryId: category.id,
         category: category.name,
         actionType: "assign_benefit",
         isRanked: true,
         slotCount: category.slot_count ?? null,
         allocationOrder: category.allocation_order ?? null,
         acceptsOverflow: Boolean(category.accepts_overflow),
         hasRules: (category.rules || []).some((rule) => rule.status_active !== false),
         onlyEmptyRules: (category.rules || []).length > 0 && (category.rules || []).every((rule) => rule.status_active === false || rule.logic_type === "EMPTY")
      }))
      .sort((left, right) => {
         if (left.allocationOrder == null && right.allocationOrder == null) {
            return left.category.localeCompare(right.category)
         }
         if (left.allocationOrder == null) return 1
         if (right.allocationOrder == null) return -1
         if (left.allocationOrder !== right.allocationOrder) {
            return left.allocationOrder - right.allocationOrder
         }
         return left.category.localeCompare(right.category)
      })
}

const canReceiveOverflow = ({ category, candidate }) => {
   if (!category || !candidate) return false
   if (candidate.origin_category_id === category.categoryId) return false

   if (!category.hasRules || category.onlyEmptyRules) {
      return true
   }

   if (!category.acceptsOverflow) {
      return false
   }

   return (candidate.eligible_category_ids || []).includes(category.categoryId)
}

const buildOverflowCandidate = ({ candidate, targetCategory }) => ({
   alternative_id: candidate.alternative_id,
   category_id: targetCategory.categoryId,
   category: targetCategory.category,
   origin_category_id: candidate.origin_category_id,
   allocation_source: "overflow",
   eligible_category_ids: candidate.eligible_category_ids || []
})

const generateRankedResultsWithOverflow = async ({ decisionModelId, rankedGroups, categoryConfigs }) => {
   const directGroupsById = new Map(rankedGroups.map((group) => [group.categoryId, group]))
   const assignedAlternativeIds = new Set()
   let overflowPool = []
   const finalRankedResults = []
   const unresolvedOverflowByOrigin = new Map()

   for (const categoryConfig of categoryConfigs) {
      const directGroup = directGroupsById.get(categoryConfig.categoryId)
      const directCandidates = (directGroup?.items || [])
         .filter((item) => !assignedAlternativeIds.has(item.alternative_id))
         .map((item) => ({
            ...item,
            origin_category_id: categoryConfig.categoryId,
            allocation_source: "direct"
         }))

      const overflowCandidates = overflowPool
         .filter((candidate) => !assignedAlternativeIds.has(candidate.alternative_id))
         .filter((candidate) => canReceiveOverflow({ category: categoryConfig, candidate }))
         .filter((candidate) => !directCandidates.some((item) => item.alternative_id === candidate.alternative_id))
         .map((candidate) => buildOverflowCandidate({ candidate, targetCategory: categoryConfig }))

      const categoryCandidates = [...directCandidates, ...overflowCandidates]

      overflowPool = overflowPool.filter((candidate) => !overflowCandidates.some((item) => item.alternative_id === candidate.alternative_id))

      if (!categoryCandidates.length) {
         continue
      }

      const rankingResults = await generateRankedGroupResults({
         decisionModelId,
         categoryGroup: {
            ...categoryConfig,
            categoryId: categoryConfig.categoryId,
            category: categoryConfig.category,
            slotCount: categoryConfig.slotCount
         },
         items: categoryCandidates
      })

      for (const result of rankingResults) {
         const source = categoryCandidates.find((item) => item.alternative_id === result.alternative_id)
         if (!source) continue

         if (result.slot_status === "within_slot") {
            assignedAlternativeIds.add(result.alternative_id)
            finalRankedResults.push(result)
            continue
         }

         const overflowCandidate = {
            alternative_id: result.alternative_id,
            origin_category_id: source.origin_category_id,
            eligible_category_ids: source.eligible_category_ids || [],
            previous_category_id: result.category_id
         }

         overflowPool.push(overflowCandidate)
         unresolvedOverflowByOrigin.set(result.alternative_id, {
            ...result,
            category_id: source.origin_category_id,
            category: directGroupsById.get(source.origin_category_id)?.category || result.category,
            allocation_source: source.allocation_source || "direct"
         })
      }
   }

   for (const [alternativeId, result] of unresolvedOverflowByOrigin.entries()) {
      if (!assignedAlternativeIds.has(alternativeId)) {
         finalRankedResults.push(result)
      }
   }

   return finalRankedResults.sort((left, right) => {
      if (left.category_id !== right.category_id) return left.category_id - right.category_id
      if (left.rank === null && right.rank === null) return left.alternative_id - right.alternative_id
      if (left.rank === null) return 1
      if (right.rank === null) return -1
      return left.rank - right.rank
   })
}

exports.generateRecommendation = async (decisionModelId) => {
   const ruleResult = await ruleEngine.runRuleEngine(decisionModelId)
   const baseMatrixData = await matrixBuilder.buildMatrix(decisionModelId)
   validateAlternativeAvailability(baseMatrixData)

   const groupedRuleResults = Object.values(groupRuleResultsByCategory(ruleResult))
   const rankedGroups = groupedRuleResults.filter(group => group.isRanked)
   const rejectedGroups = groupedRuleResults.filter(group => !group.isRanked)
   const categoryConfigs = await loadRankedCategoryConfigs(decisionModelId)

   const rankedResults = await generateRankedResultsWithOverflow({
      decisionModelId,
      rankedGroups,
      categoryConfigs
   })

   const rejectedResults = rejectedGroups.flatMap(group => (
      generateRejectedGroupResults({
         decisionModelId,
         categoryGroup: group
      })
   ))

   const results = await gradingService.applyGrades({
      decisionModelId,
      results: [...rankedResults, ...rejectedResults]
   })

   await db.transaction(async (transaction) => {
      await Result.destroy({
         where: { decision_model_id: decisionModelId },
         transaction
      })

      if (results.length) {
         await Result.bulkCreate(
            results.map(result => ({
               decision_model_id: result.decision_model_id,
               alternative_id: result.alternative_id,
               category_id: result.category_id,
               origin_category_id: result.origin_category_id,
               allocation_source: result.allocation_source,
               slot_status: result.slot_status,
               slot_position: result.slot_position,
               grade_code: result.grade_code,
               grade_label: result.grade_label,
               preference_score: result.preference_score,
               rank: result.rank,
               iteration: 1,
               status: result.status,
               created_at: new Date()
            })),
            { transaction }
         )
      }
   })

   return {
      results,
      grouped: serializeGroupedResponse(results, baseMatrixData.alternatives)
   }
}

module.exports.RecommendationGenerationError = RecommendationGenerationError
module.exports.groupRuleResultsByCategory = groupRuleResultsByCategory
module.exports.generateRejectedGroupResults = generateRejectedGroupResults
module.exports.serializeGroupedResponse = serializeGroupedResponse
module.exports.applySlotStatus = applySlotStatus
