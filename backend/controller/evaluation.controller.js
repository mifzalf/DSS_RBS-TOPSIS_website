const Evaluation = require("../models/evaluation.model")
const Alternative = require("../models/alternative.model")
const Criteria = require("../models/criteria.model")
const SubCriteria = require("../models/sub-criteria.model")
const evaluationService = require("../service/evaluation.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createEvaluation = async (req,res)=>{
  try{

    const {
      alternative_id,
      criteria_id,
      sub_criteria_id
    } = req.body

    const evaluation = await evaluationService.createEvaluation({
      alternative_id,
      criteria_id,
      sub_criteria_id
    })

    return sendSuccess(res, {
      status: 201,
      message:"Evaluation created successfully",
      data: evaluation
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.getEvaluationsByAlternative = async (req,res)=>{
  try{

    const {alternativeId} = req.params

    await getRequestResource({
      req,
      key: "alternative",
      model: Alternative,
      id: alternativeId,
      notFoundMessage: "Alternative not found"
    })

    const evaluations = await Evaluation.findAll({
      where:{alternative_id:alternativeId},
      include:[
        {
          association: "criteria",
          attributes:["id","name"]
        },
        {
          association: "subCriteria",
          attributes:["id","label","value"]
        }
      ]
    })

    return sendSuccess(res, {
      message: "Evaluation list retrieved successfully",
      data: evaluations
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.getEvaluationById = async (req,res)=>{
  try{

    const {id} = req.params

    const evaluation = await getRequestResource({
      req,
      key: "evaluation",
      model: Evaluation,
      id,
      notFoundMessage: "Evaluation not found"
    })

    await getRequestResource({
      req,
      key: "alternative",
      model: Alternative,
      id: evaluation.alternative_id,
      notFoundMessage: "Alternative not found"
    })

    return sendSuccess(res, {
      message: "Evaluation details retrieved successfully",
      data: evaluation
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.updateEvaluation = async (req,res)=>{
  try{

    const {id} = req.params

    const evaluation = await getRequestResource({
      req,
      key: "evaluation",
      model: Evaluation,
      id,
      notFoundMessage: "Evaluation not found"
    })

    await getRequestResource({
      req,
      key: "alternative",
      model: Alternative,
      id: evaluation.alternative_id,
      notFoundMessage: "Alternative not found"
    })

    const {sub_criteria_id} = req.body
    await evaluationService.updateEvaluation(evaluation, { sub_criteria_id })

    return sendSuccess(res, {
      message:"Evaluation updated successfully",
      data: evaluation
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.deleteEvaluation = async (req,res)=>{
  try{

    const {id} = req.params

    const evaluation = await getRequestResource({
      req,
      key: "evaluation",
      model: Evaluation,
      id,
      notFoundMessage: "Evaluation not found"
    })

    await getRequestResource({
      req,
      key: "alternative",
      model: Alternative,
      id: evaluation.alternative_id,
      notFoundMessage: "Alternative not found"
    })

    await evaluation.destroy()

    return sendSuccess(res, {
      message:"Evaluation deleted successfully"
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}
