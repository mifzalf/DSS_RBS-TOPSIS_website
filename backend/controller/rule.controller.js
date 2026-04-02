const Rule = require("../models/rule.model")
const DecisionModel = require("../models/decision-model.model")
const AssistanceCategory = require("../models/assistance-category.model")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")
const { RULE_ACTION_TYPES } = require("../constants/rule-actions")

const loadRuleWithCategory = async (ruleId) => {
  return Rule.findByPk(ruleId, {
    include: [{ association: "categoryRef", attributes: ["id", "code", "name", "is_ranked"] }]
  })
}

exports.createRule = async (req,res)=>{
  try{

    const {
      decision_model_id,
      name,
      priority,
      logic_type,
      action_type,
      category_id
    } = req.body

    const decisionModel = await DecisionModel.findByPk(decision_model_id)

    if(!decisionModel){
      return res.status(404).json({
        message:"Decision model not found"
      })
    }

    const category = await AssistanceCategory.findByPk(category_id)

    if(!category || category.decision_model_id !== decision_model_id){
      return res.status(404).json({
        message:"Assistance category not found"
      })
    }

    const rule = await Rule.create({
      decision_model_id,
      category_id,
      name,
      priority,
      logic_type,
      action_type,
      status_active:true,
      created_at:new Date()
    })

    const hydratedRule = await loadRuleWithCategory(rule.id)

    return sendSuccess(res, {
      status: 201,
      message:"Rule created successfully",
      data: hydratedRule
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.getRulesByDecisionModel = async (req,res)=>{
  try{

    const decisionModelId = req.decisionModelId || req.params.decisionModelId || req.params.decision_model_id

    const rules = await Rule.findAll({
      where:{decision_model_id:decisionModelId},
      include:[{ association: "categoryRef", attributes:["id","code","name","is_ranked"] }],
      order:[["priority","ASC"]]
    })

    return sendSuccess(res, {
      message: "Rule list retrieved successfully",
      data: rules
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.getRuleById = async (req,res)=>{
  try{

    const {id} = req.params

    const rule = await loadRuleWithCategory(id)

    if(!rule){
      return res.status(404).json({
        message:"Rule not found"
      })
    }

    req.rule = rule

    return sendSuccess(res, {
      message: "Rule details retrieved successfully",
      data: rule
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.updateRule = async (req,res)=>{
  try{

    const {id} = req.params

    const rule = await getRequestResource({
      req,
      key: "rule",
      model: Rule,
      id,
      notFoundMessage: "Rule not found"
    })

    const updateData = {}

    const {
      name,
      priority,
      logic_type,
      action_type,
      category_id,
      status_active
    } = req.body

    if(name?.trim()){
      updateData.name = name
    }

    if(priority !== undefined){
      updateData.priority = priority
    }

    if(logic_type === "AND" || logic_type === "OR"){
      updateData.logic_type = logic_type
    }

    if(action_type === RULE_ACTION_TYPES.ASSIGN_BENEFIT || action_type === RULE_ACTION_TYPES.REJECT){
      updateData.action_type = action_type
    }

    if(category_id !== undefined){
      const category = await AssistanceCategory.findByPk(category_id)

      if(!category || category.decision_model_id !== rule.decision_model_id){
        return res.status(404).json({
          message:"Assistance category not found"
        })
      }

      updateData.category_id = category_id
    }

    if(status_active !== undefined){
      updateData.status_active = status_active
    }

    await rule.update(updateData)

    const hydratedRule = await loadRuleWithCategory(rule.id)

    return sendSuccess(res, {
      message:"Rule updated successfully",
      data: hydratedRule
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}

exports.deleteRule = async (req,res)=>{
  try{

    const {id} = req.params

    const rule = await getRequestResource({
      req,
      key: "rule",
      model: Rule,
      id,
      notFoundMessage: "Rule not found"
    })

    await rule.destroy()

    return sendSuccess(res, {
      message:"Rule deleted successfully"
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}
