const RuleCondition = require("../models/ruleConditions")
const Rule = require("../models/rules")
const handleControllerError = require("../utils/controllerError")

exports.createRuleCondition = async (req,res)=>{
    try{

        const {rule_id,field,operator,value} = req.body

        const rule = req.rule || await Rule.findByPk(rule_id)

        if(!rule){
            return res.status(404).json({
                message:"Rule not found"
            })
        }

        const condition = await RuleCondition.create({
            rule_id,
            field,
            operator,
            value
        })

        res.status(201).json({
            message:"Rule condition created successfully",
            data:condition
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getConditionsByRule = async (req,res)=>{
    try{

        const {ruleId} = req.params

        const rule = req.rule || await Rule.findByPk(ruleId)

        if(!rule){
            return res.status(404).json({
                message:"Rule not found"
            })
        }

        const conditions = await RuleCondition.findAll({
            where:{rule_id:ruleId}
        })

        res.json({
            data:conditions
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getRuleConditionById = async (req,res)=>{
    try{

        const {id} = req.params

        const condition = req.ruleCondition || await RuleCondition.findByPk(id)

        if(!condition){
            return res.status(404).json({
                message:"Rule condition not found"
            })
        }

        const rule = req.rule || await Rule.findByPk(condition.rule_id)

        if(!rule){
            return res.status(404).json({
                message:"Rule not found"
            })
        }

        res.json({
            data:condition
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.updateRuleCondition = async (req,res)=>{
    try{

        const {id} = req.params

        const condition = req.ruleCondition || await RuleCondition.findByPk(id)

        if(!condition){
            return res.status(404).json({
                message:"Rule condition not found"
            })
        }

        const rule = req.rule || await Rule.findByPk(condition.rule_id)

        if(!rule){
            return res.status(404).json({
                message:"Rule not found"
            })
        }

        const updateData = {}

        const {field,operator,value} = req.body

        if(field?.trim()){
            updateData.field = field
        }

        if(operator?.trim()){
            updateData.operator = operator
        }

        if(value?.trim()){
            updateData.value = value
        }

        await condition.update(updateData)

        res.json({
            message:"Rule condition updated successfully",
            data:condition
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.deleteRuleCondition = async (req,res)=>{
    try{

        const {id} = req.params

        const condition = req.ruleCondition || await RuleCondition.findByPk(id)

        if(!condition){
            return res.status(404).json({
                message:"Rule condition not found"
            })
        }

        const rule = req.rule || await Rule.findByPk(condition.rule_id)

        if(!rule){
            return res.status(404).json({
                message:"Rule not found"
            })
        }

        await condition.destroy()

        res.json({
            message:"Rule condition deleted successfully"
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}
