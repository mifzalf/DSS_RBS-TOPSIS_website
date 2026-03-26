const Alternative = require("../models/alternative.model")
const DecisionModel = require("../models/decision-model.model")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

const getDecisionModelIdFromParams = (req) => req.params.decisionModelId || req.params.decision_model_id

const createAlternative = async (req, res) => {
    try {
        const { decision_model_id, name, description } = req.body

        const decisionModel = await DecisionModel.findByPk(decision_model_id)

        if (!decisionModel) {
            return res.status(404).json({
                message: "Decision model not found"
            })
        }

        const alternative = await Alternative.create({
            decision_model_id,
            name,
            description,
            created_at: new Date(),
        })
        return sendSuccess(res, {
            status: 201,
            message: "Alternative created successfully",
            data: alternative
        })
    } catch (error) {
        return handleControllerError(res, error)
    }
}

const getAlternativesByDecisionModel = async (req, res) => {
    try {
        const decisionModelId = getDecisionModelIdFromParams(req)

        const alternatives = await Alternative.findAll({
            where: {
                decision_model_id: decisionModelId
            }
        })

        return sendSuccess(res, {
            message: "Alternative list retrieved successfully",
            data: alternatives
        })
    } catch (error) {
        return handleControllerError(res, error)
    }
}

const getAlternativeById = async (req, res) => {
    try {
        const { id } = req.params

        const alternative = await getRequestResource({
            req,
            key: "alternative",
            model: Alternative,
            id,
            notFoundMessage: "Alternative not found"
        })

        return sendSuccess(res, {
            message: "Alternative details retrieved successfully",
            data: alternative
        })
    } catch (error) {
        return handleControllerError(res,error)
    }
}

const updateAlternative = async (req,res)=>{
    try{

    const {id} = req.params

    const alternative = await getRequestResource({
        req,
        key: "alternative",
        model: Alternative,
        id,
        notFoundMessage: "Alternative not found"
    })

    const updateData = {}

    const {name,description} = req.body

    if(name?.trim()){
        updateData.name = name
    }

    if(description?.trim()){
        updateData.description = description
    }

    await alternative.update(updateData)

    return sendSuccess(res, {
        message:"Alternative updated successfully",
        data: alternative
    })

  }catch(error){
        return handleControllerError(res,error)
  }
}

const deleteAlternative = async (req,res)=>{
  try{

    const {id} = req.params

    const alternative = await getRequestResource({
      req,
      key: "alternative",
      model: Alternative,
      id,
      notFoundMessage: "Alternative not found"
    })

    await alternative.destroy()

    return sendSuccess(res, {
      message:"Alternative deleted successfully"
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.createAlternative = createAlternative
exports.getAlternativesByDecisionModel = getAlternativesByDecisionModel
exports.getAlternativeById = getAlternativeById
exports.updateAlternative = updateAlternative
exports.deleteAlternative = deleteAlternative

exports.createAlternatives = createAlternative
exports.getAlternativessByDecisionModel = getAlternativesByDecisionModel
exports.getAlternativesById = getAlternativeById
exports.updateAlternatives = updateAlternative
exports.deleteAlternatives = deleteAlternative
