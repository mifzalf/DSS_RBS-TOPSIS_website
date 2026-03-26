const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const DecisionModel = require("./decision-model.model")
const { buildModelOptions } = require("./model-options")

const Rule = db.define("Rule", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 150]
    }
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  logic_type: {
    type: DataTypes.ENUM("AND", "OR"),
    allowNull: false
  },
  action_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  target_category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  status_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
  },
}, buildModelOptions("rules"))

DecisionModel.hasMany(Rule, {
  foreignKey: "decision_model_id",
  as: "rules",
  onDelete: "CASCADE"
})
Rule.belongsTo(DecisionModel, {
  foreignKey: "decision_model_id",
  as: "decisionModel"
})

module.exports = Rule
