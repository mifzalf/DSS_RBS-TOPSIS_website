const Criteria = require("../models/criteria")

exports.createCriteria = async (req,res)=>{
    try{

        const {
            decision_model_id,
            code,
            name,
            type,
            weight
        } = req.body

        const existingCriteria = await Criteria.findAll({
            where:{ decision_model_id }
        })

        const totalWeight = existingCriteria.reduce((sum,item)=>{
            return sum + item.weight
        },0)

        if(totalWeight + Number(weight) > 1){
            return res.status(400).json({
                message:"Total weight cannot exceed 1"
            })
        }

        const criteria = await Criteria.create({
            decision_model_id,
            code,
            name,
            type,
            weight,
            status_active:true,
            created_at:new Date()
        })

        res.status(201).json({
            message:"Criteria created successfully",
            data:criteria
        })

    }catch(error){
        res.status(500).json({
            message:error.message
        })
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

        res.json({
            data:criteria
        })

    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }
}

exports.getCriteriaById = async (req,res)=>{
    try{

        const {id} = req.params

        const criteria = await Criteria.findByPk(id)

        if(!criteria){
            return res.status(404).json({
                message:"Criteria not found"
            })
        }

        res.json({
            data:criteria
        })

    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }
}

exports.updateCriteria = async (req,res)=>{
    try{

        const {id} = req.params
        

        const criteria = await Criteria.findByPk(id)

        if(!criteria){
            return res.status(404).json({
                message:"Criteria not found"
            })
        }

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

            const allCriteria = await Criteria.findAll({
                where:{
                    decision_model_id:criteria.decision_model_id
                }
            })

            const totalWeight = allCriteria.reduce((sum,item)=>{
                return sum + item.weight
            },0)

            const newTotal = totalWeight - criteria.weight + Number(weight)

            if(newTotal > 1){
                return res.status(400).json({
                    message:"Total weight cannot exceed 1"
                })
            }
            updateData.weight = weight
        }

        if(status_active !== undefined && status_active !== ""){
            updateData.status_active = status_active
        }

        await criteria.update(updateData)

        res.json({
            message:"Criteria updated successfully",
            data:criteria
        })

    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }
}

exports.deleteCriteria = async (req,res)=>{
    try{

        const {id} = req.params

        const criteria = await Criteria.findByPk(id)

        if(!criteria){
            return res.status(404).json({
                message:"Criteria not found"
            })
        }

        await criteria.destroy()

        res.json({
            message:"Criteria deleted successfully"
        })

    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }
}