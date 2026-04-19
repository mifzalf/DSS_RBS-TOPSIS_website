const DecisionModel = require("../models/decision-model.model")
const decisionModelService = require("../service/decision-model.service")
const handleControllerError = require("../utils/controllerError")
const { sendSuccess } = require("../utils/apiResponse")
const { getRequestResource } = require("../utils/requestResource")

exports.createDecisionModel = async (req, res) => {
    try {
        const { name, descriptions } = req.body
        const userId = req.currentUser?.id

        const newDecisionModel = await decisionModelService.createDecisionModelWithOwner({
            name,
            descriptions,
            userId
        })

        return sendSuccess(res, {
            status: 201,
            message:"Decision model created successfully",
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

        const plainDecisionModels = decisionModels.map(model => {
            const plain = model.get({ plain: true })
            const membershipRole = plain.members?.[0]?.role
            delete plain.members
            return {
                ...plain,
                role: membershipRole
            }
        })

        const data = await decisionModelService.hydrateDecisionModelsWithReadiness(plainDecisionModels)

        return sendSuccess(res, {
            message: "Decision model list retrieved successfully",
            data
        })
    } catch (error) {
        return handleControllerError(res,error)
    }
}

exports.getDecisionModelById = async (req, res) => {
    try {
        const { id } = req.params
        const decisionModel = await getRequestResource({
            req,
            key: "decisionModel",
            model: DecisionModel,
            id,
            notFoundMessage: "Decision model not found"
        })

        return sendSuccess(res, {
            message: "Decision model details retrieved successfully",
            data: decisionModel
        })
    } catch (error) {
        return handleControllerError(res,error)
    }
}

exports.updateDecisionModel = async (req, res) => {
    try {
        const { id } = req.params
        const { name, descriptions } = req.body

        const decisionModel = await getRequestResource({
            req,
            key: "decisionModel",
            model: DecisionModel,
            id,
            notFoundMessage: "Decision model not found"
        })

        const updateData = {}

        if(name?.trim()){
            updateData.name = name
        }

        if(descriptions?.trim()){
            updateData.descriptions = descriptions
        }

        await decisionModel.update(updateData)

        return sendSuccess(res, {
            message: "Decision model updated successfully",
            data: decisionModel
        })
    } catch (error) {
        return handleControllerError(res,error)
    }
}

exports.deleteDecisionModel = async (req, res) => {
    try {
        const { id } = req.params

        const decisionModel = await getRequestResource({
            req,
            key: "decisionModel",
            model: DecisionModel,
            id,
            notFoundMessage: "Decision model not found"
        })

        await decisionModel.destroy()
        return sendSuccess(res, {
            message: "Decision model deleted successfully"
        })
    } catch (error) {
        return handleControllerError(res,error)
    }
}
