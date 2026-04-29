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
       const decisionModelId = req.params.decisionModelId

       const [existingPolicies, categories] = await Promise.all([
          ResultGradePolicy.findAll({
             where: { decision_model_id: decisionModelId },
             include: [{ association: "ranges" }, { association: "categoryRef", attributes:["id","code","name","is_ranked"] }]
          }),
          AssistanceCategory.findAll({
             where: { decision_model_id: decisionModelId },
             attributes: ["id", "is_ranked"]
          })
       ])

       const coveredCategoryIds = new Set(existingPolicies.map(p => p.category_id))

       for (const category of categories) {
          if (!coveredCategoryIds.has(category.id)) {
             const status = category.is_ranked ? "ranked" : "rejected"

             const policy = await gradePolicyService.createGradePolicy({
                decision_model_id: Number(decisionModelId),
                category_id: category.id,
                applies_to_status: status
             })

             const hydrated = await loadPolicyWithRelations(policy.id)
             existingPolicies.push(hydrated)
          }
       }

       return sendSuccess(res, {
          message: "Result grade policy list retrieved successfully",
          data: existingPolicies
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
