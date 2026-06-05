const { db } = require("../config/database")

const DecisionModel = require("../models/decision-model.model")
const DecisionModelUser = require("../models/decision-model-user.model")
const AssistanceCategory = require("../models/assistance-category.model")
const Criteria = require("../models/criteria.model")
const SubCriteria = require("../models/sub-criteria.model")
const RuleVariable = require("../models/rule-variable.model")
const Rule = require("../models/rule.model")
const RuleCondition = require("../models/rule-condition.model")
const Alternative = require("../models/alternative.model")
const Evaluation = require("../models/evaluation.model")
const RuleEvaluation = require("../models/rule-evaluation.model")
const ResultGradePolicy = require("../models/result-grade-policy.model")
const ResultGradeRange = require("../models/result-grade-range.model")

const { ROLES } = require("./authorization.service")
const { ValidationError, NotFoundError } = require("../utils/appError")

// Layanan duplikasi decision model.
//
// Pendekatan: seluruh proses berjalan dalam satu transaksi Sequelize agar
// atomic — kalau salah satu langkah gagal, tidak ada model "setengah jadi"
// yang tertinggal di database. Kunci kebenarannya adalah memelihara peta
// "oldId -> newId" untuk setiap entitas induk, sehingga semua foreign key di
// entitas anak (rule, sub-criteria, evaluation, dst) bisa di-rewire ke ID
// baru yang baru saja dibuat.
//
// Yang TIDAK pernah di-clone (selalu mulai bersih):
//   - Result               : snapshot rekomendasi, harus di-generate ulang.
//   - ImportHistory        : log operasional milik model sumber.
//   - DecisionModelUser    : kecuali owner = user pemicu duplikasi.
//
// Yang opsional via flag `includeAlternatives`:
//   - Alternative
//   - Evaluation           (nilai sub-kriteria per alternatif)
//   - RuleEvaluation       (nilai variabel RBS per alternatif)
//
// Catatan: kalau `includeAlternatives = false`, ketiga tabel di atas dilewati
// total — duplikat akan punya struktur (kategori, kriteria, rule, dst) yang
// sama persis tapi tanpa populasi alternatif.

const buildDuplicateName = (originalName) => {
   const base = (originalName || "Untitled").trim()
   return `${base} (Copy)`
}

const pickAttributes = (instance, fields) => {
   const plain = typeof instance.get === "function" ? instance.get({ plain: true }) : instance
   const result = {}
   for (const field of fields) {
      result[field] = plain[field]
   }
   return result
}

const duplicateAssistanceCategories = async ({ sourceModelId, newModelId, transaction }) => {
   const rows = await AssistanceCategory.findAll({
      where: { decision_model_id: sourceModelId },
      transaction
   })

   const idMap = new Map()

   for (const row of rows) {
      const payload = pickAttributes(row, [
         "code",
         "name",
         "description",
         "is_ranked",
         "slot_count",
         "allocation_order",
         "accepts_overflow",
         "status_active"
      ])

      const created = await AssistanceCategory.create(
         { ...payload, decision_model_id: newModelId, created_at: new Date() },
         { transaction }
      )

      idMap.set(row.id, created.id)
   }

   return idMap
}

const duplicateCriteriaWithSubCriteria = async ({ sourceModelId, newModelId, transaction }) => {
   const rows = await Criteria.findAll({
      where: { decision_model_id: sourceModelId },
      include: [{ association: "subCriteria" }],
      transaction
   })

   const criteriaIdMap = new Map()
   const subCriteriaIdMap = new Map()

   for (const row of rows) {
      const criteriaPayload = pickAttributes(row, ["code", "name", "type", "weight", "status_active"])

      const createdCriteria = await Criteria.create(
         { ...criteriaPayload, decision_model_id: newModelId, created_at: new Date() },
         { transaction }
      )

      criteriaIdMap.set(row.id, createdCriteria.id)

      const subRows = row.subCriteria || []

      if (subRows.length === 0) continue

      const subPayloads = subRows.map((sub) => ({
         criteria_id: createdCriteria.id,
         label: sub.label,
         value: sub.value
      }))

      const createdSubs = await SubCriteria.bulkCreate(subPayloads, {
         transaction,
         returning: true
      })

      subRows.forEach((sub, index) => {
         subCriteriaIdMap.set(sub.id, createdSubs[index].id)
      })
   }

   return { criteriaIdMap, subCriteriaIdMap }
}

const duplicateRuleVariables = async ({ sourceModelId, newModelId, transaction }) => {
   const rows = await RuleVariable.findAll({
      where: { decision_model_id: sourceModelId },
      transaction
   })

   const idMap = new Map()

   for (const row of rows) {
      const payload = pickAttributes(row, ["code", "name", "value_type", "description", "status_active"])

      const created = await RuleVariable.create(
         { ...payload, decision_model_id: newModelId, created_at: new Date() },
         { transaction }
      )

      idMap.set(row.id, created.id)
   }

   return idMap
}

const duplicateRulesWithConditions = async ({
   sourceModelId,
   newModelId,
   categoryIdMap,
   ruleVariableIdMap,
   transaction
}) => {
   const rows = await Rule.findAll({
      where: { decision_model_id: sourceModelId },
      include: [{ association: "conditions" }],
      transaction
   })

   for (const row of rows) {
      const newCategoryId = categoryIdMap.get(row.category_id)

      if (!newCategoryId) {
         // Aman dilewati: rule yang menunjuk kategori yang sudah tidak ada
         // di sumber tidak boleh menyeret duplikat ke state inkonsisten.
         continue
      }

      const rulePayload = pickAttributes(row, [
         "name",
         "priority",
         "logic_type",
         "min_match_count",
         "action_type",
         "status_active"
      ])

      const createdRule = await Rule.create(
         {
            ...rulePayload,
            decision_model_id: newModelId,
            category_id: newCategoryId,
            created_at: new Date()
         },
         { transaction }
      )

      const conditions = row.conditions || []

      if (conditions.length === 0) continue

      const conditionPayloads = conditions.map((cond) => ({
         rule_id: createdRule.id,
         // rule_variable_id boleh null (sesuai schema), jadi map opsional.
         rule_variable_id: cond.rule_variable_id != null ? ruleVariableIdMap.get(cond.rule_variable_id) ?? null : null,
         field: cond.field,
         value: cond.value,
         operator: cond.operator
      }))

      await RuleCondition.bulkCreate(conditionPayloads, { transaction })
   }
}

const duplicateGradePolicies = async ({ sourceModelId, newModelId, categoryIdMap, transaction }) => {
   const rows = await ResultGradePolicy.findAll({
      where: { decision_model_id: sourceModelId },
      include: [{ association: "ranges" }],
      transaction
   })

   for (const row of rows) {
      const newCategoryId = categoryIdMap.get(row.category_id)

      if (!newCategoryId) continue

      const createdPolicy = await ResultGradePolicy.create(
         {
            decision_model_id: newModelId,
            category_id: newCategoryId,
            applies_to_status: row.applies_to_status,
            created_at: new Date()
         },
         { transaction }
      )

      const ranges = row.ranges || []

      if (ranges.length === 0) continue

      const rangePayloads = ranges.map((range) => ({
         result_grade_policy_id: createdPolicy.id,
         label: range.label,
         code: range.code,
         min_score: range.min_score,
         max_score: range.max_score,
         sort_order: range.sort_order,
         result_status: range.result_status,
         created_at: new Date()
      }))

      await ResultGradeRange.bulkCreate(rangePayloads, { transaction })
   }
}

const duplicateAlternativesWithEvaluations = async ({
   sourceModelId,
   newModelId,
   criteriaIdMap,
   subCriteriaIdMap,
   ruleVariableIdMap,
   transaction
}) => {
   const alternatives = await Alternative.findAll({
      where: { decision_model_id: sourceModelId },
      include: [
         { association: "evaluations" },
         { association: "ruleEvaluations" }
      ],
      transaction
   })

   for (const alt of alternatives) {
      const createdAlt = await Alternative.create(
         {
            decision_model_id: newModelId,
            name: alt.name,
            description: alt.description,
            created_at: new Date()
         },
         { transaction }
      )

      const evaluations = alt.evaluations || []

      if (evaluations.length > 0) {
         const evalPayloads = []

         for (const evaluation of evaluations) {
            const newCriteriaId = criteriaIdMap.get(evaluation.criteria_id)
            const newSubCriteriaId = subCriteriaIdMap.get(evaluation.sub_criteria_id)

            // Lewati evaluasi yang menunjuk kriteria/sub yang sudah dihapus
            // di sumber — anomali data lama yang tidak perlu menggagalkan
            // keseluruhan duplikasi.
            if (!newCriteriaId || !newSubCriteriaId) continue

            evalPayloads.push({
               alternative_id: createdAlt.id,
               criteria_id: newCriteriaId,
               sub_criteria_id: newSubCriteriaId
            })
         }

         if (evalPayloads.length > 0) {
            await Evaluation.bulkCreate(evalPayloads, { transaction })
         }
      }

      const ruleEvaluations = alt.ruleEvaluations || []

      if (ruleEvaluations.length > 0) {
         const ruleEvalPayloads = []

         for (const ruleEval of ruleEvaluations) {
            const newRuleVariableId = ruleVariableIdMap.get(ruleEval.rule_variable_id)

            if (!newRuleVariableId) continue

            ruleEvalPayloads.push({
               alternative_id: createdAlt.id,
               rule_variable_id: newRuleVariableId,
               value_boolean: ruleEval.value_boolean,
               value_number: ruleEval.value_number,
               value_string: ruleEval.value_string,
               created_at: new Date()
            })
         }

         if (ruleEvalPayloads.length > 0) {
            await RuleEvaluation.bulkCreate(ruleEvalPayloads, { transaction })
         }
      }
   }
}

const duplicateDecisionModel = async ({
   sourceModelId,
   userId,
   name,
   includeAlternatives = true
}) => {
   if (!sourceModelId) {
      throw new ValidationError("Source decision model id is required")
   }

   if (!userId) {
      throw new ValidationError("Authenticated user is required")
   }

   return db.transaction(async (transaction) => {
      const source = await DecisionModel.findByPk(sourceModelId, { transaction })

      if (!source) {
         throw new NotFoundError("Source decision model not found")
      }

      const resolvedName = (name && name.trim()) || buildDuplicateName(source.name)

      const newModel = await DecisionModel.create(
         {
            name: resolvedName,
            descriptions: source.descriptions,
            created_at: new Date()
         },
         { transaction }
      )

      // Pemicu duplikasi otomatis menjadi owner workspace baru, terlepas dari
      // perannya di model sumber. Tidak menyalin member lain — duplikat adalah
      // milik pribadi user yang melakukannya.
      await DecisionModelUser.create(
         {
            decision_model_id: newModel.id,
            user_id: userId,
            role: ROLES.OWNER,
            created_at: new Date()
         },
         { transaction }
      )

      const categoryIdMap = await duplicateAssistanceCategories({
         sourceModelId,
         newModelId: newModel.id,
         transaction
      })

      const { criteriaIdMap, subCriteriaIdMap } = await duplicateCriteriaWithSubCriteria({
         sourceModelId,
         newModelId: newModel.id,
         transaction
      })

      const ruleVariableIdMap = await duplicateRuleVariables({
         sourceModelId,
         newModelId: newModel.id,
         transaction
      })

      await duplicateRulesWithConditions({
         sourceModelId,
         newModelId: newModel.id,
         categoryIdMap,
         ruleVariableIdMap,
         transaction
      })

      await duplicateGradePolicies({
         sourceModelId,
         newModelId: newModel.id,
         categoryIdMap,
         transaction
      })

      if (includeAlternatives) {
         await duplicateAlternativesWithEvaluations({
            sourceModelId,
            newModelId: newModel.id,
            criteriaIdMap,
            subCriteriaIdMap,
            ruleVariableIdMap,
            transaction
         })
      }

      return newModel
   })
}

module.exports = {
   duplicateDecisionModel,
   buildDuplicateName
}
