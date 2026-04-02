const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const DecisionModel = require("./decision-model.model")
const Alternative = require("./alternative.model")
const AssistanceCategory = require("./assistance-category.model")

const Result = db.define("Result", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  decision_model_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  alternative_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  grade_code: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  grade_label: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  preference_score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    }
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  iteration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  created_at: {
    type: DataTypes.DATE,
  },
}, buildModelOptions("results"))

DecisionModel.hasMany(Result, {
  foreignKey: "decision_model_id",
  as: "results",
  onDelete: "CASCADE"
})
Result.belongsTo(DecisionModel, {
  foreignKey: "decision_model_id",
  as: "decisionModel"
})

Alternative.hasMany(Result, {
  foreignKey: "alternative_id",
  as: "results",
  onDelete: "CASCADE"
})
Result.belongsTo(Alternative, {
  foreignKey: "alternative_id",
  as: "alternative"
})

AssistanceCategory.hasMany(Result, {
  foreignKey: "category_id",
  as: "results",
  onDelete: "SET NULL"
})
Result.belongsTo(AssistanceCategory, {
  foreignKey: "category_id",
  as: "categoryRef"
})

module.exports = Result
