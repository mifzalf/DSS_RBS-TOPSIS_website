const SubCriteria = require("../models/sub-criteria.model")
const Criteria = require("../models/criteria.model")
const subCriteriaService = require("../service/sub-criteria.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

const resolveCriteria = async (req, criteriaId) => {
   if (req.criteria) {
      return req.criteria
   }

   if (!criteriaId) {
      return null
   }

    return getRequestResource({
       req,
       key: "criteria",
       model: Criteria,
       id: criteriaId,
       notFoundMessage: "Criteria not found"
    })
}

const resolveSubCriteria = async (req, id) => {
   if (req.subCriteria) {
      return req.subCriteria
   }

   if (!id) {
      return null
   }

    return getRequestResource({
       req,
       key: "subCriteria",
       model: SubCriteria,
       id,
       notFoundMessage: "Sub-criteria not found"
    })
}

exports.createSubCriteria = async (req,res)=>{
    try{
        const criteriaIdFromParam = req.params.criteriaId
        const {criteria_id, label, value} = req.body

        const criteria = await resolveCriteria(req, criteriaIdFromParam || criteria_id)

        if(!criteria){
            return res.status(404).json({
                message:"Criteria not found"
            })
        }

        const subCriteria = await subCriteriaService.createSubCriteria({
            criteria,
            criteriaIdFromBody: criteria_id,
            label,
            value
        })

        return sendSuccess(res, {
            status: 201,
            message:"Sub-criteria created successfully",
            data: subCriteria
        })
    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getSubCriteriaByCriteria = async (req,res)=>{
    try{
        const {criteriaId} = req.params

        const criteria = await resolveCriteria(req, criteriaId)

        if(!criteria){
            return res.status(404).json({
                message:"Criteria not found"
            })
        }

        const subCriteria = await SubCriteria.findAll({
            where:{
                criteria_id:criteria.id
            }
        })
        return sendSuccess(res, {
            message: "Sub-criteria list retrieved successfully",
            data: subCriteria
        })
    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getSubCriteriaById = async (req,res)=>{
    try{
        const {id} = req.params
        const subCriteria = await resolveSubCriteria(req, id)

        if(!subCriteria){
            return res.status(404).json({
                message:"Sub-criteria not found"
            })
        }

        return sendSuccess(res, {
            message: "Sub-criteria details retrieved successfully",
            data: subCriteria
        })
    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.updateSubCriteria = async (req,res)=>{
    try{

        const {id} = req.params

        const subCriteria = await resolveSubCriteria(req, id)

        if(!subCriteria){
            return res.status(404).json({
                message:"Sub-criteria not found"
            })
        }

        const updateData = {}

        const {label,value} = req.body

        if(label?.trim()){
            updateData.label = label
        }

        if(value !== undefined && value !== ""){
            updateData.value = value
        }

        await subCriteriaService.updateSubCriteria(subCriteria, updateData)

        return sendSuccess(res, {
            message:"Sub-criteria updated successfully",
            data: subCriteria
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.deleteSubCriteria = async (req,res)=>{
    try{

        const {id} = req.params

        const subCriteria = await resolveSubCriteria(req, id)

        if(!subCriteria){
            return res.status(404).json({
                message:"Sub-criteria not found"
            })
        }

        await subCriteria.destroy()

        return sendSuccess(res, {
            message:"Sub-criteria deleted successfully"
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}
