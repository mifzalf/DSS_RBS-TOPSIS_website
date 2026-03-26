const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const DecisionModel = require("./decision-model.model")
const { buildModelOptions } = require("./model-options")

const Criteria = db.define("Criteria", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  decision_model_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  code: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [1, 30]
    }
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 150]
    }
  },

  type: {
    type: DataTypes.ENUM("benefit", "cost"),
    allowNull: false
  },

  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 1
    }
  },

  status_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  created_at: {
    type: DataTypes.DATE,
  },

}, buildModelOptions("criteria", {
  indexes: [
    {
      unique: true,
      fields: ["decision_model_id", "code"]
    }
  ]
}))

DecisionModel.hasMany(Criteria, {
  foreignKey: "decision_model_id",
  as: "criteria",
  onDelete: "CASCADE"
})
Criteria.belongsTo(DecisionModel, {
  foreignKey: "decision_model_id",
  as: "decisionModel"
})

module.exports = Criteria
