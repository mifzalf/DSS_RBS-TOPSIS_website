const DecisionModel = require("../models/decision-model.model")
const decisionModelService = require("../service/decision-model.service")
const decisionModelDuplicateService = require("../service/decision-model-duplicate.service")
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
        const decisionModel = req.decisionModel || await DecisionModel.findByPk(id, {
            include: [
                {
                    association: "members",
                    where: { user_id: req.currentUser.id },
                    attributes: ["role"],
                    required: false
                }
            ]
        })

        if (!decisionModel) {
            return res.status(404).json({
                message: "Decision model not found"
            })
        }

        req.decisionModel = decisionModel

        const plain = decisionModel.get({ plain: true })
        const membershipRole = plain.members?.[0]?.role || null
        delete plain.members

        return sendSuccess(res, {
            message: "Decision model details retrieved successfully",
            data: {
                ...plain,
                role: membershipRole
            }
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

exports.duplicateDecisionModel = async (req, res) => {
    try {
        const sourceModelId = req.decisionModelId || Number(req.params.id)
        const userId = req.currentUser?.id
        const { name, include_alternatives } = req.body || {}

        const newDecisionModel = await decisionModelDuplicateService.duplicateDecisionModel({
            sourceModelId,
            userId,
            name,
            includeAlternatives: include_alternatives !== false
        })

        return sendSuccess(res, {
            status: 201,
            message: "Decision model duplicated successfully",
            data: newDecisionModel
        })
    } catch (error) {
        return handleControllerError(res, error)
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
