const DecisionModel = require("../models/decisionModel")
const DecisionModelUser = require("../models/decisionModelUser")
const { ROLES } = require("../service/authorization.service")
const handleControllerError = require("../utils/controllerError")

exports.createDecisionModel = async (req, res) => {
    try {
        const { name, descriptions } = req.body
        const userId = req.currentUser?.id

        const newDecisionModel = await DecisionModel.create({
            name,
            descriptions,
            created_at: new Date(),
        })

        await DecisionModelUser.create({
            decision_model_id: newDecisionModel.id,
            user_id: userId,
            role: ROLES.OWNER,
            created_at: new Date()
        })

        res.status(201).json({
            message:"Decision Model created successfully",
            data: newDecisionModel
        })
        
    } catch (error) {
        return handleControllerError(res,error)
    }
}

exports.getAllDecisionModels = async (req, res) => {
    try {
        const decisionModels = await DecisionModel.findAll({
            include: [
                {
                    association: "members",
                    where: { user_id: req.currentUser.id },
                    attributes: ["role"],
                    required: true
                }
            ],
            order: [["created_at", "DESC"]]
        })

        const data = decisionModels.map(model => {
            const plain = model.get({ plain: true })
            const membershipRole = plain.members?.[0]?.role
            delete plain.members
            return {
                ...plain,
                role: membershipRole
            }
        })

        res.json({
            message: "Decision Models retrieved successfully",
            data
        })
    } catch (error) {
        return handleControllerError(res,error)
    }
}

exports.getDecisionModelById = async (req, res) => {
    try {
        const { id } = req.params
        res.json({
            message: "Decision Model retrieved successfully",
            data: req.decisionModel || await DecisionModel.findByPk(id)
        })
    } catch (error) {
        return handleControllerError(res,error)
    }
}

exports.updateDecisionModel = async (req, res) => {
    try {
        const { id } = req.params
        const { name, descriptions } = req.body

        const decisionModel = req.decisionModel || await DecisionModel.findByPk(id)

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
        return handleControllerError(res,error)
    }
}

exports.deleteDecisionModel = async (req, res) => {
    try {
        const { id } = req.params

        const decisionModel = req.decisionModel || await DecisionModel.findByPk(id)

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
        return handleControllerError(res,error)
    }
}
