const RuleCondition = require("../models/rule-condition.model")
const Rule = require("../models/rule.model")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createRuleCondition = async (req,res)=>{
    try{

        const {rule_id,field,operator,value} = req.body

        await getRequestResource({
            req,
            key: "rule",
            model: Rule,
            id: rule_id,
            notFoundMessage: "Rule not found"
        })

        const condition = await RuleCondition.create({
            rule_id,
            field,
            operator,
            value
        })

        return sendSuccess(res, {
            status: 201,
            message:"Rule condition created successfully",
            data: condition
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getConditionsByRule = async (req,res)=>{
    try{

        const {ruleId} = req.params

        await getRequestResource({
            req,
            key: "rule",
            model: Rule,
            id: ruleId,
            notFoundMessage: "Rule not found"
        })

        const conditions = await RuleCondition.findAll({
            where:{rule_id:ruleId}
        })

        return sendSuccess(res, {
            message: "Rule condition list retrieved successfully",
            data: conditions
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.getRuleConditionById = async (req,res)=>{
    try{

        const {id} = req.params

        const condition = await getRequestResource({
            req,
            key: "ruleCondition",
            model: RuleCondition,
            id,
            notFoundMessage: "Rule condition not found"
        })

        await getRequestResource({
            req,
            key: "rule",
            model: Rule,
            id: condition.rule_id,
            notFoundMessage: "Rule not found"
        })

        return sendSuccess(res, {
            message: "Rule condition details retrieved successfully",
            data: condition
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.updateRuleCondition = async (req,res)=>{
    try{

        const {id} = req.params

        const condition = await getRequestResource({
            req,
            key: "ruleCondition",
            model: RuleCondition,
            id,
            notFoundMessage: "Rule condition not found"
        })

        await getRequestResource({
            req,
            key: "rule",
            model: Rule,
            id: condition.rule_id,
            notFoundMessage: "Rule not found"
        })

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

        return sendSuccess(res, {
            message:"Rule condition updated successfully",
            data: condition
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}

exports.deleteRuleCondition = async (req,res)=>{
    try{

        const {id} = req.params

        const condition = await getRequestResource({
            req,
            key: "ruleCondition",
            model: RuleCondition,
            id,
            notFoundMessage: "Rule condition not found"
        })

        await getRequestResource({
            req,
            key: "rule",
            model: Rule,
            id: condition.rule_id,
            notFoundMessage: "Rule not found"
        })

        await condition.destroy()

        return sendSuccess(res, {
            message:"Rule condition deleted successfully"
        })

    }catch(error){
        return handleControllerError(res,error)
    }
}
