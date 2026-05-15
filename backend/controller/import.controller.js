const DecisionModel = require("../models/decision-model.model")

const previewCache = require("../service/import/preview-cache.service")
const builder = require("../service/import/workbook-builder.service")
const auditService = require("../service/import/import-history.service")

const alternativeImport = require("../service/import/alternatives/alternative-import.service")
const alternativeTemplate = require("../service/import/alternatives/alternative-template")

const topsisImport = require("../service/import/topsis-evaluations/topsis-import.service")
const topsisTemplate = require("../service/import/topsis-evaluations/topsis-template")

const ruleEvaluationImport = require("../service/import/rule-evaluations/rule-evaluation-import.service")
const ruleEvaluationTemplate = require("../service/import/rule-evaluations/rule-evaluation-template")

const Alternative = require("../models/alternative.model")
const Evaluation = require("../models/evaluation.model")
const RuleEvaluation = require("../models/rule-evaluation.model")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { IMPORT_MODES, IMPORT_TYPES } = require("../models/import-history.model")

const VALID_MODES = new Set(Object.values(IMPORT_MODES))

const resolveMode = (raw) => {
   if (!raw) return IMPORT_MODES.UPSERT
   const lowered = String(raw).toLowerCase()
   if (VALID_MODES.has(lowered)) return lowered
   return IMPORT_MODES.UPSERT
}

const resolveSkipInvalid = (raw) => {
   if (raw === undefined || raw === null) return true
   if (typeof raw === "boolean") return raw
   const value = String(raw).toLowerCase()
   if (value === "false" || value === "0" || value === "no") return false
   return true
}

const sendBufferDownload = (res, { buffer, filename }) => {
   res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
   res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
   res.setHeader("Content-Length", buffer.length)
   res.send(buffer)
}

const determineSideEffects = (kind, summary) => {
   const writes = (summary?.to_create || 0) + (summary?.to_update || 0)
   const recommendationInvalidated = writes > 0 && (kind === IMPORT_TYPES.TOPSIS_EVALUATIONS || kind === IMPORT_TYPES.RULE_EVALUATIONS || kind === IMPORT_TYPES.ALTERNATIVES)
   return {
      recommendation_invalidated: recommendationInvalidated
   }
}

const renderPreviewResponse = (res, { preview, expiresAt, token }) => {
   return sendSuccess(res, {
      message: "Import preview generated",
      data: {
         preview_token: token,
         expires_at: expiresAt,
         kind: preview.kind,
         mode: preview.mode,
         headers: preview.headers,
         summary: preview.summary,
         rows: preview.rows,
         warnings: preview.warnings || [],
         template_metadata: preview.template_metadata || null
      }
   })
}

const runPreview = async ({ req, res, kind, build }) => {
   try {
      if (!req.file?.buffer) {
         return res.status(400).json({ message: "File is required" })
      }

      const decisionModelId = req.decisionModelId
      const mode = resolveMode(req.body?.mode)

      const preview = await build({ buffer: req.file.buffer, decisionModelId, mode })

      const { token, expires_at } = previewCache.savePreview({
         userId: req.currentUser.id,
         decisionModelId,
         kind,
         preview,
         file_name: req.file.originalname,
         mode
      })

      return renderPreviewResponse(res, { preview, expiresAt: expires_at, token })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

const runCommit = async ({ req, res, kind, commit, importType }) => {
   try {
      const token = req.body?.preview_token
      const skipInvalid = resolveSkipInvalid(req.body?.skip_invalid)

      const entry = previewCache.consumePreview({
         token,
         userId: req.currentUser.id,
         decisionModelId: req.decisionModelId,
         kind
      })

      const startedAt = Date.now()

      let outcome
      try {
         outcome = await commit({ preview: entry.preview, skipInvalid, decisionModelId: req.decisionModelId })
      } catch (commitError) {
         await auditService.recordImport({
            decisionModelId: req.decisionModelId,
            userId: req.currentUser.id,
            importType,
            mode: entry.mode,
            fileName: entry.file_name,
            totalRows: entry.preview.summary.total_rows,
            createdCount: 0,
            updatedCount: 0,
            skippedCount: entry.preview.summary.total_rows,
            status: "failed",
            errorSummary: commitError.message,
            durationMs: Date.now() - startedAt
         })
         throw commitError
      }

      const status = outcome.created + outcome.updated > 0
         ? (entry.preview.summary.invalid_count > 0 ? "partial" : "success")
         : "partial"

      await auditService.recordImport({
         decisionModelId: req.decisionModelId,
         userId: req.currentUser.id,
         importType,
         mode: entry.mode,
         fileName: entry.file_name,
         totalRows: entry.preview.summary.total_rows,
         createdCount: outcome.created,
         updatedCount: outcome.updated,
         skippedCount: outcome.skipped,
         status,
         errorSummary: null,
         durationMs: outcome.duration_ms
      })

      return sendSuccess(res, {
         message: "Import completed",
         data: {
            kind,
            mode: entry.mode,
            created: outcome.created,
            updated: outcome.updated,
            skipped: outcome.skipped,
            duration_ms: outcome.duration_ms,
            side_effects: determineSideEffects(importType, entry.preview.summary)
         }
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.downloadAlternativeTemplate = async (req, res) => {
   try {
      const decisionModel = await DecisionModel.findByPk(req.decisionModelId)
      const workbook = alternativeTemplate.buildAlternativeTemplate({
         decisionModelId: req.decisionModelId,
         decisionModelName: decisionModel?.name
      })
      const buffer = Buffer.from(await builder.writeWorkbookToBuffer(workbook))
      return sendBufferDownload(res, {
         buffer,
         filename: `alternatives-template-dm-${req.decisionModelId}.xlsx`
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.previewAlternativeImport = async (req, res) => {
   return runPreview({
      req,
      res,
      kind: alternativeImport.KIND,
      build: alternativeImport.buildPreview
   })
}

exports.commitAlternativeImport = async (req, res) => {
   return runCommit({
      req,
      res,
      kind: alternativeImport.KIND,
      commit: alternativeImport.commitPreview,
      importType: IMPORT_TYPES.ALTERNATIVES
   })
}

exports.downloadTopsisTemplate = async (req, res) => {
   try {
      const decisionModel = await DecisionModel.findByPk(req.decisionModelId)
      const alternatives = await Alternative.findAll({
         where: { decision_model_id: req.decisionModelId },
         attributes: ["id", "name"],
         order: [["id", "ASC"]]
      })

      const alternativeIds = alternatives.map((alternative) => alternative.id)

      const existingEvaluations = alternativeIds.length
         ? await Evaluation.findAll({
              where: { alternative_id: alternativeIds },
              attributes: ["id", "alternative_id", "criteria_id", "sub_criteria_id"]
           })
         : []

      const { workbook } = await topsisTemplate.buildTopsisTemplate({
         decisionModelId: req.decisionModelId,
         decisionModelName: decisionModel?.name,
         alternatives,
         existingEvaluations
      })
      const buffer = Buffer.from(await builder.writeWorkbookToBuffer(workbook))
      return sendBufferDownload(res, {
         buffer,
         filename: `topsis-evaluations-template-dm-${req.decisionModelId}.xlsx`
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.previewTopsisImport = async (req, res) => {
   return runPreview({
      req,
      res,
      kind: topsisImport.KIND,
      build: topsisImport.buildPreview
   })
}

exports.commitTopsisImport = async (req, res) => {
   return runCommit({
      req,
      res,
      kind: topsisImport.KIND,
      commit: topsisImport.commitPreview,
      importType: IMPORT_TYPES.TOPSIS_EVALUATIONS
   })
}

exports.downloadRuleEvaluationTemplate = async (req, res) => {
   try {
      const decisionModel = await DecisionModel.findByPk(req.decisionModelId)
      const alternatives = await Alternative.findAll({
         where: { decision_model_id: req.decisionModelId },
         attributes: ["id", "name"],
         order: [["id", "ASC"]]
      })

      const alternativeIds = alternatives.map((alternative) => alternative.id)

      const existingEvaluations = alternativeIds.length
         ? await RuleEvaluation.findAll({
              where: { alternative_id: alternativeIds },
              attributes: [
                 "id",
                 "alternative_id",
                 "rule_variable_id",
                 "value_boolean",
                 "value_number",
                 "value_string"
              ]
           })
         : []

      const { workbook } = await ruleEvaluationTemplate.buildRuleEvaluationTemplate({
         decisionModelId: req.decisionModelId,
         decisionModelName: decisionModel?.name,
         alternatives,
         existingEvaluations
      })
      const buffer = Buffer.from(await builder.writeWorkbookToBuffer(workbook))
      return sendBufferDownload(res, {
         buffer,
         filename: `rule-evaluations-template-dm-${req.decisionModelId}.xlsx`
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.previewRuleEvaluationImport = async (req, res) => {
   return runPreview({
      req,
      res,
      kind: ruleEvaluationImport.KIND,
      build: ruleEvaluationImport.buildPreview
   })
}

exports.commitRuleEvaluationImport = async (req, res) => {
   return runCommit({
      req,
      res,
      kind: ruleEvaluationImport.KIND,
      commit: ruleEvaluationImport.commitPreview,
      importType: IMPORT_TYPES.RULE_EVALUATIONS
   })
}

exports.listImportHistory = async (req, res) => {
   try {
      const records = await auditService.listHistory({
         decisionModelId: req.decisionModelId,
         limit: req.query?.limit
      })
      return sendSuccess(res, {
         message: "Import history fetched",
         data: records.map((record) => ({
            id: record.id,
            decision_model_id: record.decision_model_id,
            import_type: record.import_type,
            mode: record.mode,
            file_name: record.file_name,
            total_rows: record.total_rows,
            created_count: record.created_count,
            updated_count: record.updated_count,
            skipped_count: record.skipped_count,
            status: record.status,
            error_summary: record.error_summary,
            duration_ms: record.duration_ms,
            created_at: record.created_at,
            user: record.user ? { id: record.user.id, name: record.user.name, username: record.user.username } : null
         }))
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
