const Result = require("../models/results")
const DecisionModel = require("../models/decisionModel")
const Alternative = require("../models/alternatives")
const handleControllerError = require("../utils/controllerError")

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

        res.status(201).json({
            message:"Result created successfully",
            data:result
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
                    model:Alternative,
                    attributes:["id","name"]
                }
            ],
            order:[["rank","ASC"]]
        })

        res.json({
            data:results
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getResultById = async (req,res)=>{
    try{

        const {id} = req.params

        const result = req.result || await Result.findByPk(id)

        if(!result){
            return res.status(404).json({
                message:"Result not found"
            })
        }

        res.json({
            data:result
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.updateResult = async (req,res)=>{
    try{

        const {id} = req.params

        const result = req.result || await Result.findByPk(id)

        if(!result){
            return res.status(404).json({
                message:"Result not found"
            })
        }

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

        res.json({
            message:"Result updated successfully",
            data:result
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.deleteResult = async (req,res)=>{
    try{

        const {id} = req.params

        const result = req.result || await Result.findByPk(id)

        if(!result){
            return res.status(404).json({
                message:"Result not found"
            })
        }

        await result.destroy()

        res.json({
            message:"Result deleted successfully"
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}
