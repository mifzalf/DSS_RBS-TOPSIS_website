const SubCriteria = require("../models/subCriteria")
const Criteria = require("../models/criteria")
const handleControllerError = require("../utils/controllerError")

const resolveCriteria = async (req, criteriaId) => {
   if (req.criteria) {
      return req.criteria
   }

   if (!criteriaId) {
      return null
   }

   return Criteria.findByPk(criteriaId)
}

const resolveSubCriteria = async (req, id) => {
   if (req.subCriteria) {
      return req.subCriteria
   }

   if (!id) {
      return null
   }

   return SubCriteria.findByPk(id)
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

        const subCriteria = await SubCriteria.create({
            criteria_id: criteria.id,
            label,
            value
        })

        res.status(201).json({
            message:"Sub-criteria created successfully",
            data:subCriteria
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
        res.json({
            data:subCriteria
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

        res.json({
            data:subCriteria
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
                message:"Sub criteria not found"
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

        await subCriteria.update(updateData)

        res.json({
            message:"Sub criteria updated successfully",
            data:subCriteria
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
                message:"Sub criteria not found"
            })
        }

        await subCriteria.destroy()

        res.json({
            message:"Sub criteria deleted successfully"
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}
