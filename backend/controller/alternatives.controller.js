const Alternatives = require('../models/alternatives')
const DecisionModel = require('../models/decisionModel')
const handleControllerError = require('../utils/controllerError')

exports.createAlternatives = async (req, res) => {
    try {
        const { decision_model_id, name, description } = req.body

        const decisionModel = await DecisionModel.findByPk(decision_model_id)

        if (!decisionModel) {
            return res.status(404).json({
                message: "Decision Model not found"
            })
        }

        const alternatives = await Alternatives.create({
            decision_model_id,
            name,
            description,
            created_at: new Date(),
        })
        res.status(201).json({
            message: "Alternatives created successfully",
            data: alternatives
        })
    } catch (error) {
        return handleControllerError(res, error)
    }
}

exports.getAlternativessByDecisionModel = async (req, res) => {
    try {
        const { decision_model_id } = req.params

        const alternativess = await Alternatives.findAll({
            where: {
                decision_model_id: decision_model_id
            }
        })
        res.status(200).json({
            message: "Alternativess fetched successfully",
            data: alternativess
        })
    } catch (error) {
        return handleControllerError(res, error)
    }
}

exports.getAlternativesById = async (req, res) => {
    try {
        const { id } = req.params

        const alternatives = req.alternative || await Alternatives.findByPk(id)

        if (!alternatives) {
            return res.status(404).json({
                message: "Alternatives not found"
            })
        }

        res.status(200).json({
            message: "Alternatives fetched successfully",
            data: alternatives
        })
    } catch (error) {
        return handleControllerError(res,error)
    }
}

exports.updateAlternatives = async (req,res)=>{
    try{

    const {id} = req.params

    const alternatives = req.alternative || await Alternatives.findByPk(id)

    if(!alternatives){
        return res.status(404).json({
            message:"Alternatives not found"
        })
    }

    const updateData = {}

    const {name,description} = req.body

    if(name?.trim()){
        updateData.name = name
    }

    if(description?.trim()){
        updateData.description = description
    }

    await alternatives.update(updateData)

    res.json({
        message:"Alternatives updated successfully",
        data:alternatives
    })

  }catch(error){
        return handleControllerError(res,error)
  }
}

exports.deleteAlternatives = async (req,res)=>{
  try{

    const {id} = req.params

    const alternatives = req.alternative || await Alternatives.findByPk(id)

    if(!alternatives){
      return res.status(404).json({
        message:"Alternatives not found"
      })
    }

    await alternatives.destroy()

    res.json({
      message:"Alternatives deleted successfully"
    })

  }catch(error){
    return handleControllerError(res,error)
  }
}
