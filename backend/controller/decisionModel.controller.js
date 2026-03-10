const DecisionModel = require("../models/decisionModel")

exports.createDecisionModel = async (req, res) => {
    try {
        const { name, descriptions } = req.body

        const newDecisionModel = await DecisionModel.create({
            name,
            descriptions,
            created_at: new Date(),
        })
        res.status(201).json({
            message:"Decision Model created successfully",
            data: newDecisionModel
        })
        
    } catch (error) {
        res.status(500).json({
             message: error.message
         })
    }
}

exports.getAllDecisionModels = async (req, res) => {
    try {
        const decisionModels = await DecisionModel.findAll()

        res.json({
            message: "Decision Models retrieved successfully",
            data: decisionModels
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

exports.getDecisionModelById = async (req, res) => {
    try {
        const { id } = req.params
        const decisionModel = await DecisionModel.findByPk(id)

        if (!decisionModel) {
            return res.status(404).json({
                message: "Decision Model not found"
            })
        }

        res.json({
            message: "Decision Model retrieved successfully",
            data: decisionModel
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

exports.updateDecisionModel = async (req, res) => {
    try {
        const { id } = req.params
        const { name, descriptions } = req.body

        const decisionModel = await DecisionModel.findByPk(id)

        if (!decisionModel) {
            return res.status(404).json({
                message: "Decision Model not found"
            })
        }

        const updateData = {}

        if(name?.trim()){
            updateData.name = name
        }

        if(descriptions?.trim()){
            updateData.descriptions = descriptions
        }

        await decisionModel.update(updateData)

        res.json({
            message: "Decision Model updated successfully",
            data: decisionModel
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

exports.deleteDecisionModel = async (req, res) => {
    try {
        const { id } = req.params

        const decisionModel = await DecisionModel.findByPk(id)

        if (!decisionModel) {
            return res.status(404).json({
                message: "Decision Model not found"
            })
        }

        await decisionModel.destroy()
        res.json({
            message: "Decision Model deleted successfully"
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}