const express = require("express")
const router = express.Router()

const importController = require("../controller/import.controller")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const { ROLES } = require("../service/authorization.service")
const { uploadSingle } = require("../middleware/uploadExcel")

const positiveId = { type: "integer", required: true, min: 1 }

const decisionModelParamSchema = {
   params: { decisionModelId: positiveId }
}

const decisionModelParamWithLimitSchema = {
   params: { decisionModelId: positiveId },
   query: {
      limit: { type: "integer", required: false, min: 1, max: 200 }
   }
}

const previewSchema = {
   params: { decisionModelId: positiveId }
}

const commitSchema = {
   params: { decisionModelId: positiveId },
   body: {
      preview_token: { type: "string", required: true, minLength: 1, maxLength: 80 }
   }
}

const buildAuthorize = (roles) => authorizeDecisionModel({
   source: "params",
   field: "decisionModelId",
   roles
})

const VIEW_ROLES = [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
const WRITE_ROLES = [ROLES.OWNER, ROLES.EDITOR]

// Alternatives
router.get(
   "/decision-model/:decisionModelId/alternatives/template",
   validateRequest(decisionModelParamSchema),
   buildAuthorize(VIEW_ROLES),
   importController.downloadAlternativeTemplate
)

router.post(
   "/decision-model/:decisionModelId/alternatives/preview",
   validateRequest(previewSchema),
   buildAuthorize(WRITE_ROLES),
   uploadSingle("file"),
   importController.previewAlternativeImport
)

router.post(
   "/decision-model/:decisionModelId/alternatives/commit",
   validateRequest(commitSchema),
   buildAuthorize(WRITE_ROLES),
   importController.commitAlternativeImport
)

// TOPSIS Evaluations
router.get(
   "/decision-model/:decisionModelId/topsis-evaluations/template",
   validateRequest(decisionModelParamSchema),
   buildAuthorize(VIEW_ROLES),
   importController.downloadTopsisTemplate
)

router.post(
   "/decision-model/:decisionModelId/topsis-evaluations/preview",
   validateRequest(previewSchema),
   buildAuthorize(WRITE_ROLES),
   uploadSingle("file"),
   importController.previewTopsisImport
)

router.post(
   "/decision-model/:decisionModelId/topsis-evaluations/commit",
   validateRequest(commitSchema),
   buildAuthorize(WRITE_ROLES),
   importController.commitTopsisImport
)

// Rule Evaluations
router.get(
   "/decision-model/:decisionModelId/rule-evaluations/template",
   validateRequest(decisionModelParamSchema),
   buildAuthorize(VIEW_ROLES),
   importController.downloadRuleEvaluationTemplate
)

router.post(
   "/decision-model/:decisionModelId/rule-evaluations/preview",
   validateRequest(previewSchema),
   buildAuthorize(WRITE_ROLES),
   uploadSingle("file"),
   importController.previewRuleEvaluationImport
)

router.post(
   "/decision-model/:decisionModelId/rule-evaluations/commit",
   validateRequest(commitSchema),
   buildAuthorize(WRITE_ROLES),
   importController.commitRuleEvaluationImport
)

// History
router.get(
   "/decision-model/:decisionModelId/history",
   validateRequest(decisionModelParamWithLimitSchema),
   buildAuthorize(VIEW_ROLES),
   importController.listImportHistory
)

module.exports = router
