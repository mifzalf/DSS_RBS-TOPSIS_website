const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const DecisionModel = require("./decision-model.model")
const AssistanceCategory = require("./assistance-category.model")
const { buildModelOptions } = require("./model-options")
const { RULE_ACTION_TYPE_VALUES } = require("../constants/rule-actions")

const Rule = db.define("Rule", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
      isIn: [RULE_ACTION_TYPE_VALUES]
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

AssistanceCategory.hasMany(Rule, {
  foreignKey: "category_id",
  as: "rules",
  onDelete: "SET NULL"
})
Rule.belongsTo(AssistanceCategory, {
  foreignKey: "category_id",
  as: "categoryRef"
})

module.exports = Rule
