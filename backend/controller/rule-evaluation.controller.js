const RuleEvaluation = require("../models/rule-evaluation.model")
const Alternative = require("../models/alternative.model")
const RuleVariable = require("../models/rule-variable.model")
const ruleEvaluationService = require("../service/rule-evaluation.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createRuleEvaluation = async (req, res) => {
   try {
      const ruleEvaluation = await ruleEvaluationService.createRuleEvaluation(req.body)

      return sendSuccess(res, {
         status: 201,
         message: "Rule evaluation created successfully",
         data: ruleEvaluation
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getRuleEvaluationsByAlternative = async (req, res) => {
   try {
      await getRequestResource({
         req,
         key: "alternative",
         model: Alternative,
         id: req.params.alternativeId,
         notFoundMessage: "Alternative not found"
      })

      const data = await RuleEvaluation.findAll({
         where: { alternative_id: req.params.alternativeId },
         include: [
            {
               association: "ruleVariable",
               attributes: ["id", "code", "name", "value_type"]
            }
         ],
         order: [["id", "ASC"]]
      })

      return sendSuccess(res, {
         message: "Rule evaluation list retrieved successfully",
         data
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getRuleEvaluationById = async (req, res) => {
   try {
      const ruleEvaluation = await getRequestResource({
         req,
         key: "ruleEvaluation",
         model: RuleEvaluation,
         id: req.params.id,
         notFoundMessage: "Rule evaluation not found"
      })

      return sendSuccess(res, {
         message: "Rule evaluation details retrieved successfully",
         data: ruleEvaluation
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.updateRuleEvaluation = async (req, res) => {
   try {
      const ruleEvaluation = await getRequestResource({
         req,
         key: "ruleEvaluation",
         model: RuleEvaluation,
         id: req.params.id,
         notFoundMessage: "Rule evaluation not found"
      })

      await getRequestResource({
         req,
         key: "ruleVariable",
         model: RuleVariable,
         id: ruleEvaluation.rule_variable_id,
         notFoundMessage: "Rule variable not found"
      })

      await ruleEvaluationService.updateRuleEvaluation(ruleEvaluation, req.body)

      return sendSuccess(res, {
         message: "Rule evaluation updated successfully",
         data: ruleEvaluation
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.deleteRuleEvaluation = async (req, res) => {
   try {
      const ruleEvaluation = await getRequestResource({
         req,
         key: "ruleEvaluation",
         model: RuleEvaluation,
         id: req.params.id,
         notFoundMessage: "Rule evaluation not found"
      })

      await ruleEvaluation.destroy()

      return sendSuccess(res, {
         message: "Rule evaluation deleted successfully"
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
