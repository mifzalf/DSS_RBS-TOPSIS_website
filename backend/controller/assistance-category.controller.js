const AssistanceCategory = require("../models/assistance-category.model")
const DecisionModel = require("../models/decision-model.model")
const assistanceCategoryService = require("../service/assistance-category.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createAssistanceCategory = async (req, res) => {
   try {
      const { decision_model_id, code, name, description, is_ranked, status_active } = req.body

      const decisionModel = await DecisionModel.findByPk(decision_model_id)

      if (!decisionModel) {
         return res.status(404).json({ message: "Decision model not found" })
      }

      const category = await assistanceCategoryService.createCategory({
         decision_model_id,
         code,
         name,
         description,
         is_ranked,
         status_active
      })

      return sendSuccess(res, {
         status: 201,
         message: "Assistance category created successfully",
         data: category
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getCategoriesByDecisionModel = async (req, res) => {
   try {
      const data = await AssistanceCategory.findAll({
         where: { decision_model_id: req.params.decisionModelId },
         order: [["name", "ASC"]]
      })

      return sendSuccess(res, {
         message: "Assistance category list retrieved successfully",
         data
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getCategoryById = async (req, res) => {
   try {
      const category = await getRequestResource({
         req,
         key: "assistanceCategory",
         model: AssistanceCategory,
         id: req.params.id,
         notFoundMessage: "Assistance category not found"
      })

      return sendSuccess(res, {
         message: "Assistance category details retrieved successfully",
         data: category
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.updateCategory = async (req, res) => {
   try {
      const category = await getRequestResource({
         req,
         key: "assistanceCategory",
         model: AssistanceCategory,
         id: req.params.id,
         notFoundMessage: "Assistance category not found"
      })

      const updateData = {}
      const { code, name, description, is_ranked, status_active } = req.body

      if (code?.trim()) updateData.code = code
      if (name?.trim()) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (is_ranked !== undefined) updateData.is_ranked = is_ranked
      if (status_active !== undefined) updateData.status_active = status_active

      await assistanceCategoryService.updateCategory(category, updateData)

      return sendSuccess(res, {
         message: "Assistance category updated successfully",
         data: category
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.deleteCategory = async (req, res) => {
   try {
      const category = await getRequestResource({
         req,
         key: "assistanceCategory",
         model: AssistanceCategory,
         id: req.params.id,
         notFoundMessage: "Assistance category not found"
      })

      await category.destroy()

      return sendSuccess(res, {
         message: "Assistance category deleted successfully"
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
