const Criteria = require("../models/criteria.model")
const criteriaService = require("../service/criteria.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createCriteria = async (req,res)=>{
    try{

        const {
            decision_model_id,
            code,
            name,
            type,
            weight
        } = req.body

        const criteria = await criteriaService.createCriteria({
            decision_model_id,
            code,
            name,
            type,
            weight
        })

        return sendSuccess(res, {
            status: 201,
            message:"Criteria created successfully",
            data: criteria
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getCriteriaByDecisionModel = async (req,res)=>{
    try{

        const {decisionModelId} = req.params

        const criteria = await Criteria.findAll({
            where:{
                decision_model_id:decisionModelId
            }
        })

        return sendSuccess(res, {
            message: "Criteria list retrieved successfully",
            data: criteria
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getCriteriaById = async (req,res)=>{
    try{

        const {id} = req.params

        const criteria = await getRequestResource({
            req,
            key: "criteria",
            model: Criteria,
            id,
            notFoundMessage: "Criteria not found"
        })

        return sendSuccess(res, {
            message: "Criteria details retrieved successfully",
            data: criteria
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.updateCriteria = async (req,res)=>{
    try{

        const {id} = req.params
        

        const criteria = await getRequestResource({
            req,
            key: "criteria",
            model: Criteria,
            id,
            notFoundMessage: "Criteria not found"
        })

        const updateData = {}

        const {code,name,type,weight,status_active} = req.body

        if(code?.trim()){
            updateData.code = code
        }

        if(name?.trim()){
            updateData.name = name
        }

        if(type === "benefit" || type === "cost"){
            updateData.type = type
        }

        if(weight !== undefined && weight !== ""){
            updateData.weight = weight
        }

        if(status_active !== undefined && status_active !== ""){
            updateData.status_active = status_active
        }

        await criteriaService.updateCriteria(criteria, updateData)

        return sendSuccess(res, {
            message:"Criteria updated successfully",
            data: criteria
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.deleteCriteria = async (req,res)=>{
    try{

        const {id} = req.params

        const criteria = await getRequestResource({
            req,
            key: "criteria",
            model: Criteria,
            id,
            notFoundMessage: "Criteria not found"
        })

        await criteria.destroy()

        return sendSuccess(res, {
            message:"Criteria deleted successfully"
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}
