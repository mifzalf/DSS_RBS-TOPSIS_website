const RuleCondition = require("../models/rule-condition.model")
const Rule = require("../models/rule.model")
const RuleVariable = require("../models/rule-variable.model")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")
const { ValidationError } = require("../utils/appError")

const ensureConditionTarget = async ({ req, rule, ruleVariableId, field }) => {
    if (!ruleVariableId && !field?.trim()) {
        throw new ValidationError("rule_variable_id or field is required")
    }

    if (!ruleVariableId) {
        return { ruleVariable: null, field: field.trim() }
    }

    const ruleVariable = await getRequestResource({
        req,
        key: "ruleVariable",
        model: RuleVariable,
        id: ruleVariableId,
        notFoundMessage: "Rule variable not found"
    })

    if (ruleVariable.decision_model_id !== rule.decision_model_id) {
        throw new ValidationError("Rule variable must belong to the same decision model as the rule")
    }

    return {
        ruleVariable,
        field: field?.trim() || ruleVariable.code
    }
}

exports.createRuleCondition = async (req,res)=>{
    try{

        const {rule_id, rule_variable_id, field, operator, value} = req.body

        const rule = await getRequestResource({
            req,
            key: "rule",
            model: Rule,
            id: rule_id,
            notFoundMessage: "Rule not found"
        })

        const target = await ensureConditionTarget({
            req,
            rule,
            ruleVariableId: rule_variable_id,
            field
        })

        const condition = await RuleCondition.create({
            rule_id,
            rule_variable_id: target.ruleVariable?.id || null,
            field: target.field,
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

        const {rule_variable_id, field, operator, value} = req.body

        const rule = await getRequestResource({
            req,
            key: "rule",
            model: Rule,
            id: condition.rule_id,
            notFoundMessage: "Rule not found"
        })

        if(rule_variable_id !== undefined || field?.trim()){
            const target = await ensureConditionTarget({
                req,
                rule,
                ruleVariableId: rule_variable_id,
                field: field ?? condition.field
            })
            updateData.rule_variable_id = target.ruleVariable?.id || null
            updateData.field = target.field
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
