const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const DecisionModel = require("./decision-model.model")
const Alternative = require("./alternative.model")

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
  category: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 100]
    }
  },
  preference_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 1
    }
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
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

module.exports = Result
