const RuleVariable = require("../models/rule-variable.model")
const DecisionModel = require("../models/decision-model.model")
const ruleVariableService = require("../service/rule-variable.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createRuleVariable = async (req, res) => {
   try {
      const { decision_model_id, code, name, value_type, description, status_active } = req.body

      const decisionModel = await DecisionModel.findByPk(decision_model_id)

      if (!decisionModel) {
         return res.status(404).json({ message: "Decision model not found" })
      }

      const ruleVariable = await ruleVariableService.createRuleVariable({
         decision_model_id,
         code,
         name,
         value_type,
         description,
         status_active
      })

      return sendSuccess(res, {
         status: 201,
         message: "Rule variable created successfully",
         data: ruleVariable
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getRuleVariablesByDecisionModel = async (req, res) => {
   try {
      const decisionModelId = req.params.decisionModelId

      const data = await RuleVariable.findAll({
         where: { decision_model_id: decisionModelId },
         order: [["code", "ASC"]]
      })

      return sendSuccess(res, {
         message: "Rule variable list retrieved successfully",
         data
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getRuleVariableById = async (req, res) => {
   try {
      const ruleVariable = await getRequestResource({
         req,
         key: "ruleVariable",
         model: RuleVariable,
         id: req.params.id,
         notFoundMessage: "Rule variable not found"
      })

      return sendSuccess(res, {
         message: "Rule variable details retrieved successfully",
         data: ruleVariable
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.updateRuleVariable = async (req, res) => {
   try {
      const ruleVariable = await getRequestResource({
         req,
         key: "ruleVariable",
         model: RuleVariable,
         id: req.params.id,
         notFoundMessage: "Rule variable not found"
      })

      const updateData = {}
      const { code, name, value_type, description, status_active } = req.body

      if (code?.trim()) updateData.code = code
      if (name?.trim()) updateData.name = name
      if (value_type) updateData.value_type = value_type
      if (description !== undefined) updateData.description = description
      if (status_active !== undefined) updateData.status_active = status_active

      await ruleVariableService.updateRuleVariable(ruleVariable, updateData)

      return sendSuccess(res, {
         message: "Rule variable updated successfully",
         data: ruleVariable
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.deleteRuleVariable = async (req, res) => {
   try {
      const ruleVariable = await getRequestResource({
         req,
         key: "ruleVariable",
         model: RuleVariable,
         id: req.params.id,
         notFoundMessage: "Rule variable not found"
      })

      await ruleVariable.destroy()

      return sendSuccess(res, {
         message: "Rule variable deleted successfully"
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
