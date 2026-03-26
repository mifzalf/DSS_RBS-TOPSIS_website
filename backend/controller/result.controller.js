const Result = require("../models/result.model")
const DecisionModel = require("../models/decision-model.model")
const Alternative = require("../models/alternative.model")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createResult = async (req,res)=>{
    try{

        const {
            decision_model_id,
            alternative_id,
            category,
            preference_score,
            rank,
            iteration,
            status
        } = req.body

        const decisionModel = await DecisionModel.findByPk(decision_model_id)

        if(!decisionModel){
            return res.status(404).json({
                message:"Decision model not found"
            })
        }

        const alternative = await Alternative.findByPk(alternative_id)

        if(!alternative){
            return res.status(404).json({
                message:"Alternative not found"
            })
        }

        const result = await Result.create({
            decision_model_id,
            alternative_id,
            category,
            preference_score,
            rank,
            iteration,
            status,
            created_at:new Date()
        })

        return sendSuccess(res, {
            status: 201,
            message:"Result created successfully",
            data: result
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getResultsByDecisionModel = async (req,res)=>{
    try{

        const decisionModelId = req.decisionModelId || req.params.decisionModelId || req.params.decision_model_id

        const results = await Result.findAll({
            where:{decision_model_id:decisionModelId},
            include:[
                {
                    association: "alternative",
                    attributes:["id","name"]
                }
            ],
            order:[["rank","ASC"]]
        })

        return sendSuccess(res, {
            message: "Result list retrieved successfully",
            data: results
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getResultById = async (req,res)=>{
    try{

        const {id} = req.params

        const result = await getRequestResource({
            req,
            key: "result",
            model: Result,
            id,
            notFoundMessage: "Result not found"
        })

        return sendSuccess(res, {
            message: "Result details retrieved successfully",
            data: result
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.updateResult = async (req,res)=>{
    try{

        const {id} = req.params

        const result = await getRequestResource({
            req,
            key: "result",
            model: Result,
            id,
            notFoundMessage: "Result not found"
        })

        const updateData = {}

        const {
            category,
            preference_score,
            rank,
            iteration,
            status
        } = req.body

        if(category?.trim()){
            updateData.category = category
        }

        if(preference_score !== undefined){
            updateData.preference_score = preference_score
        }

        if(rank !== undefined){
            updateData.rank = rank
        }

        if(iteration !== undefined){
            updateData.iteration = iteration
        }

        if(status?.trim()){
            updateData.status = status
        }

        await result.update(updateData)

        return sendSuccess(res, {
            message:"Result updated successfully",
            data: result
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.deleteResult = async (req,res)=>{
    try{

        const {id} = req.params

        const result = await getRequestResource({
            req,
            key: "result",
            model: Result,
            id,
            notFoundMessage: "Result not found"
        })

        await result.destroy()

        return sendSuccess(res, {
            message:"Result deleted successfully"
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}
