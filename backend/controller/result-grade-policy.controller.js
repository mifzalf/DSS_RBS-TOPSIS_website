const ResultGradePolicy = require("../models/result-grade-policy.model")
const DecisionModel = require("../models/decision-model.model")
const AssistanceCategory = require("../models/assistance-category.model")
const gradePolicyService = require("../service/result-grade-policy.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

const loadPolicyWithRelations = async (policyId) => {
   return ResultGradePolicy.findByPk(policyId, {
      include: [{ association: "ranges" }, { association: "categoryRef", attributes:["id","code","name","is_ranked"] }]
   })
}

exports.createGradePolicy = async (req, res) => {
   try {
      const { decision_model_id, category_id, applies_to_status } = req.body

      const decisionModel = await DecisionModel.findByPk(decision_model_id)

      if (!decisionModel) {
         return res.status(404).json({ message: "Decision model not found" })
      }

      const category = await AssistanceCategory.findByPk(category_id)

      if (!category || category.decision_model_id !== decision_model_id) {
         return res.status(404).json({ message: "Assistance category not found" })
      }

      const policy = await gradePolicyService.createGradePolicy({
         decision_model_id,
         category_id,
         applies_to_status
      })

      const hydratedPolicy = await loadPolicyWithRelations(policy.id)

      return sendSuccess(res, {
         status: 201,
         message: "Result grade policy created successfully",
         data: hydratedPolicy
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getPoliciesByDecisionModel = async (req, res) => {
   try {
      const data = await ResultGradePolicy.findAll({
         where: { decision_model_id: req.params.decisionModelId },
         include: [{ association: "ranges" }, { association: "categoryRef", attributes:["id","code","name","is_ranked"] }],
         order: [["category", "ASC"]]
      })

      return sendSuccess(res, {
         message: "Result grade policy list retrieved successfully",
         data
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getPolicyById = async (req, res) => {
   try {
      const policy = await loadPolicyWithRelations(req.params.id)

      if (!policy) {
         return res.status(404).json({
            message: "Result grade policy not found"
         })
      }

      req.resultGradePolicy = policy

      return sendSuccess(res, {
         message: "Result grade policy details retrieved successfully",
         data: policy
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.updatePolicy = async (req, res) => {
   try {
      const policy = await getRequestResource({
         req,
         key: "resultGradePolicy",
         model: ResultGradePolicy,
         id: req.params.id,
         notFoundMessage: "Result grade policy not found"
      })

      const updateData = {}
      const { category_id, applies_to_status } = req.body

      if (category_id !== undefined) {
         const category = await AssistanceCategory.findByPk(category_id)

         if (!category || category.decision_model_id !== policy.decision_model_id) {
            return res.status(404).json({ message: "Assistance category not found" })
         }

         updateData.category_id = category_id
      }
      if (applies_to_status) updateData.applies_to_status = applies_to_status

      await gradePolicyService.updateGradePolicy(policy, updateData)

      const hydratedPolicy = await loadPolicyWithRelations(policy.id)

      return sendSuccess(res, {
         message: "Result grade policy updated successfully",
         data: hydratedPolicy
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.deletePolicy = async (req, res) => {
   try {
      const policy = await getRequestResource({
         req,
         key: "resultGradePolicy",
         model: ResultGradePolicy,
         id: req.params.id,
         notFoundMessage: "Result grade policy not found"
      })

      await policy.destroy()

      return sendSuccess(res, {
         message: "Result grade policy deleted successfully"
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
