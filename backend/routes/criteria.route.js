const express = require("express")
const router = express.Router()

const criteriaController = require("../controller/criteria.controller")
const subcriteriaController = require("../controller/sub-criteria.controller")
const Criteria = require("../models/criteria.model")
const SubCriteria = require("../models/sub-criteria.model")
const authorizeDecisionModel = require("../middleware/authorizeDecisionModel")
const validateRequest = require("../middleware/validateRequest")
const schemas = require("../validation/schemas")
const { ROLES } = require("../service/authorization.service")
const { loadByPrimaryKey } = require("../utils/resourceLoader")

const loadCriteriaByIdParam = (paramName = "id") => async (req) => {
   const criteria = await loadByPrimaryKey({
      req,
      model: Criteria,
      id: req.params[paramName],
      requestKey: "criteria",
      notFoundMessage: "Criteria not found"
   })

   return criteria.decision_model_id
}

const loadSubCriteriaById = async (req) => {
   const subCriteria = await loadByPrimaryKey({
      req,
      model: SubCriteria,
      id: req.params.id,
      requestKey: "subCriteria",
      notFoundMessage: "Sub-criteria not found"
   })

   const criteria = await loadByPrimaryKey({
      req,
      model: Criteria,
      id: subCriteria.criteria_id,
      requestKey: "criteria",
      notFoundMessage: "Criteria not found"
   })

   return criteria.decision_model_id
}

router.post(
   "/",
   validateRequest(schemas.criteria.create),
   authorizeDecisionModel({
      source: "body",
      field: "decision_model_id",
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   criteriaController.createCriteria
)

router.get(
   "/decision-model/:decisionModelId",
   validateRequest(schemas.criteria.byDecisionModel),
   authorizeDecisionModel({
      source: "params",
      field: "decisionModelId",
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   criteriaController.getCriteriaByDecisionModel
)

router.get(
   "/:id",
   validateRequest(schemas.criteria.byId),
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   criteriaController.getCriteriaById
)

router.patch(
   "/:id",
   validateRequest(schemas.criteria.update),
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   criteriaController.updateCriteria
)

router.delete(
   "/:id",
   validateRequest(schemas.criteria.byId),
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam(),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   criteriaController.deleteCriteria
)

router.post(
   "/:criteriaId/sub-criteria",
   validateRequest(schemas.subCriteria.create),
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam("criteriaId"),
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   subcriteriaController.createSubCriteria
)

router.get(
   "/:criteriaId/sub-criteria",
   validateRequest(schemas.subCriteria.byCriteria),
   authorizeDecisionModel({
      getId: loadCriteriaByIdParam("criteriaId"),
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   subcriteriaController.getSubCriteriaByCriteria
)

router.get(
   "/sub-criteria/:id",
   validateRequest(schemas.subCriteria.byId),
   authorizeDecisionModel({
      getId: loadSubCriteriaById,
      roles: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]
   }),
   subcriteriaController.getSubCriteriaById
)

router.patch(
   "/sub-criteria/:id",
   validateRequest(schemas.subCriteria.update),
   authorizeDecisionModel({
      getId: loadSubCriteriaById,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   subcriteriaController.updateSubCriteria
)

router.delete(
   "/sub-criteria/:id",
   validateRequest(schemas.subCriteria.byId),
   authorizeDecisionModel({
      getId: loadSubCriteriaById,
      roles: [ROLES.OWNER, ROLES.EDITOR]
   }),
   subcriteriaController.deleteSubCriteria
)

module.exports = router
