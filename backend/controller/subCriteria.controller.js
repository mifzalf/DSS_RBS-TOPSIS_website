const SubCriteria = require("../models/subCriteria")
const Criteria = require("../models/criteria")

exports.createSubCriteria = async (req,res)=>{
    try{
        const {criteria_id, label, value} = req.body

        const criteria = await Criteria.findByPk(criteria_id)

        if(!criteria){
            return res.status(404).json({
                message:"Criteria not found"
            })
        }

        const subCriteria = await SubCriteria.create({
            criteria_id,
            label,
            value
        })

        res.status(201).json({
            message:"Sub-criteria created successfully",
            data:subCriteria
        })
    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }
}

exports.getSubCriteriaByCriteria = async (req,res)=>{
    try{
        const {criteriaId} = req.params

        const subCriteria = await SubCriteria.findAll({
            where:{
                criteria_id:criteriaId
            }
        })
        res.json({
            data:subCriteria
        })
    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }
}

exports.getSubCriteriaById = async (req,res)=>{
    try{
        const {id} = req.params
        const subCriteria = await SubCriteria.findByPk(id)

        if(!subCriteria){
            return res.status(404).json({
                message:"Sub-criteria not found"
            })
        }
        res.json({
            data:subCriteria
        })
    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }
}

exports.updateSubCriteria = async (req,res)=>{
    try{

        const {id} = req.params

        const subCriteria = await SubCriteria.findByPk(id)

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
        res.status(500).json({
            message:error.message
        })
    }
}

exports.deleteSubCriteria = async (req,res)=>{
    try{

        const {id} = req.params

        const subCriteria = await SubCriteria.findByPk(id)

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
        res.status(500).json({
            message:error.message
        })
    }
}
