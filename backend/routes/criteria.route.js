const express = require("express")
const createError = require("http-errors")
const router = express.Router()

const criteriaController = require("../controller/criteria.controller")
const subcriteriaController = require("../controller/subCriteria.controller")
const Criteria = require("../models/criteria")
const SubCriteria = require("../models/subCriteria")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const { ROLES } = require("../service/authorization.service")

const loadCriteriaByIdParam = (paramName = "id") => async (req) => {
   const criteria = await Criteria.findByPk(req.params[paramName])

   if (!criteria) {
      throw createError(404, "Criteria not found")
   }

   req.criteria = criteria

   return criteria.decision_model_id
}

const loadSubCriteriaById = async (req) => {
   const subCriteria = await SubCriteria.findByPk(req.params.id)

   if (!subCriteria) {
      throw createError(404, "Sub-criteria not found")
   }

   const criteria = await Criteria.findByPk(subCriteria.criteria_id)

   if (!criteria) {
      throw createError(404, "Criteria not found")
   }

   req.subCriteria = subCriteria
   req.criteria = criteria

   return criteria.decision_model_id
}

router.post(
   "/",
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   criteriaController.createCriteria
)

router.get(
   "/decision-model/:decisionModelId",
   authorizeDecisionModel({
      source: "params",
      field: "decisionModelId",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   criteriaController.getCriteriaByDecisionModel
)

router.get(
   "/:id",
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   criteriaController.getCriteriaById
)

router.patch(
   "/:id",
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   criteriaController.updateCriteria
)

router.delete(
   "/:id",
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   criteriaController.deleteCriteria
)

router.post(
   "/:criteriaId/sub-criteria",
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam("criteriaId"),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   subcriteriaController.createSubCriteria
)

router.get(
   "/:criteriaId/sub-criteria",
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam("criteriaId"),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   subcriteriaController.getSubCriteriaByCriteria
)

router.get(
   "/sub-criteria/:id",
   authorizeDecisionModel({
      getId: loadSubCriteriaById,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   subcriteriaController.getSubCriteriaById
)

router.patch(
   "/sub-criteria/:id",
   authorizeDecisionModel({
      getId: loadSubCriteriaById,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   subcriteriaController.updateSubCriteria
)

router.delete(
   "/sub-criteria/:id",
   authorizeDecisionModel({
      getId: loadSubCriteriaById,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   subcriteriaController.deleteSubCriteria
)

module.exports = router
