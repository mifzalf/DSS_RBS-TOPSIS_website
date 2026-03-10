const Rule = require("../models/rules")
const DecisionModel = require("../models/decisionModel")

exports.createRule = async (req,res)=>{
  try{

    const {
      decision_model_id,
      name,
      priority,
      logic_type,
      action_type,
      target_category
    } = req.body

    const decisionModel = await DecisionModel.findByPk(decision_model_id)

    if(!decisionModel){
      return res.status(404).json({
        message:"Decision model not found"
      })
    }

    const rule = await Rule.create({
      decision_model_id,
      name,
      priority,
      logic_type,
      action_type,
      target_category,
      status_active:true,
      created_at:new Date()
    })

    res.status(201).json({
      message:"Rule created successfully",
      data:rule
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}

exports.getRulesByDecisionModel = async (req,res)=>{
  try{

    const {decisionModelId} = req.params

    const rules = await Rule.findAll({
      where:{decision_model_id:decisionModelId},
      order:[["priority","ASC"]]
    })

    res.json({
      data:rules
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}

exports.getRuleById = async (req,res)=>{
  try{

    const {id} = req.params

    const rule = await Rule.findByPk(id)

    if(!rule){
      return res.status(404).json({
        message:"Rule not found"
      })
    }

    res.json({
      data:rule
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}

exports.updateRule = async (req,res)=>{
  try{

    const {id} = req.params

    const rule = await Rule.findByPk(id)

    if(!rule){
      return res.status(404).json({
        message:"Rule not found"
      })
    }

    const updateData = {}

    const {
      name,
      priority,
      logic_type,
      action_type,
      target_category,
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

    if(action_type?.trim()){
      updateData.action_type = action_type
    }

    if(target_category?.trim()){
      updateData.target_category = target_category
    }

    if(status_active !== undefined){
      updateData.status_active = status_active
    }

    await rule.update(updateData)

    res.json({
      message:"Rule updated successfully",
      data:rule
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}

exports.deleteRule = async (req,res)=>{
  try{

    const {id} = req.params

    const rule = await Rule.findByPk(id)

    if(!rule){
      return res.status(404).json({
        message:"Rule not found"
      })
    }

    await rule.destroy()

    res.json({
      message:"Rule deleted successfully"
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}