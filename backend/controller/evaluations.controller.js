const Evaluation = require("../models/evaluations")
const Alternative = require("../models/alternatives")
const Criteria = require("../models/criteria")
const SubCriteria = require("../models/subCriteria")

exports.createEvaluation = async (req,res)=>{
  try{

    const {
      alternative_id,
      criteria_id,
      sub_criteria_id
    } = req.body

    const alternative = await Alternative.findByPk(alternative_id)
    const criteria = await Criteria.findByPk(criteria_id)
    const subCriteria = await SubCriteria.findByPk(sub_criteria_id)

    if(!alternative){
      return res.status(404).json({
        message:"Alternative not found"
      })
    }

    if(!criteria){
      return res.status(404).json({
        message:"Criteria not found"
      })
    }

    if(!subCriteria){
      return res.status(404).json({
        message:"Sub criteria not found"
      })
    }

    const evaluation = await Evaluation.create({
      alternative_id,
      criteria_id,
      sub_criteria_id
    })

    res.status(201).json({
      message:"Evaluation created successfully",
      data:evaluation
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}

exports.getEvaluationsByAlternative = async (req,res)=>{
  try{

    const {alternativeId} = req.params

    const evaluations = await Evaluation.findAll({
      where:{alternative_id:alternativeId},
      include:[
        {
          model:Criteria,
          attributes:["id","name"]
        },
        {
          model:SubCriteria,
          attributes:["id","label","value"]
        }
      ]
    })

    res.json({
      data:evaluations
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}

exports.getEvaluationById = async (req,res)=>{
  try{

    const {id} = req.params

    const evaluation = await Evaluation.findByPk(id)

    if(!evaluation){
      return res.status(404).json({
        message:"Evaluation not found"
      })
    }

    res.json({
      data:evaluation
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}

exports.updateEvaluation = async (req,res)=>{
  try{

    const {id} = req.params

    const evaluation = await Evaluation.findByPk(id)

    if(!evaluation){
      return res.status(404).json({
        message:"Evaluation not found"
      })
    }

    const updateData = {}

    const {sub_criteria_id} = req.body

    if(sub_criteria_id !== undefined){
      updateData.sub_criteria_id = sub_criteria_id
    }

    await evaluation.update(updateData)

    res.json({
      message:"Evaluation updated successfully",
      data:evaluation
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}

exports.deleteEvaluation = async (req,res)=>{
  try{

    const {id} = req.params

    const evaluation = await Evaluation.findByPk(id)

    if(!evaluation){
      return res.status(404).json({
        message:"Evaluation not found"
      })
    }

    await evaluation.destroy()

    res.json({
      message:"Evaluation deleted successfully"
    })

  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}