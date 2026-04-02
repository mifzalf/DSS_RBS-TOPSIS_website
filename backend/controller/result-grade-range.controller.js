const ResultGradeRange = require("../models/result-grade-range.model")
const ResultGradePolicy = require("../models/result-grade-policy.model")
const gradeRangeService = require("../service/result-grade-range.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createGradeRange = async (req, res) => {
   try {
      const range = await gradeRangeService.createGradeRange(req.body)

      return sendSuccess(res, {
         status: 201,
         message: "Result grade range created successfully",
         data: range
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getRangesByPolicy = async (req, res) => {
   try {
      await getRequestResource({
         req,
         key: "resultGradePolicy",
         model: ResultGradePolicy,
         id: req.params.policyId,
         notFoundMessage: "Result grade policy not found"
      })

      const data = await ResultGradeRange.findAll({
         where: { result_grade_policy_id: req.params.policyId },
         order: [["sort_order", "ASC"]]
      })

      return sendSuccess(res, {
         message: "Result grade range list retrieved successfully",
         data
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.getRangeById = async (req, res) => {
   try {
      const range = await getRequestResource({
         req,
         key: "resultGradeRange",
         model: ResultGradeRange,
         id: req.params.id,
         notFoundMessage: "Result grade range not found"
      })

      return sendSuccess(res, {
         message: "Result grade range details retrieved successfully",
         data: range
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.updateRange = async (req, res) => {
   try {
      const range = await getRequestResource({
         req,
         key: "resultGradeRange",
         model: ResultGradeRange,
         id: req.params.id,
         notFoundMessage: "Result grade range not found"
      })

      await gradeRangeService.updateGradeRange(range, req.body)

      return sendSuccess(res, {
         message: "Result grade range updated successfully",
         data: range
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}

exports.deleteRange = async (req, res) => {
   try {
      const range = await getRequestResource({
         req,
         key: "resultGradeRange",
         model: ResultGradeRange,
         id: req.params.id,
         notFoundMessage: "Result grade range not found"
      })

      await range.destroy()

      return sendSuccess(res, {
         message: "Result grade range deleted successfully"
      })
   } catch (error) {
      return handleControllerError(res, error)
   }
}
