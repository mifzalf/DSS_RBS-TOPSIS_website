const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const Rule = require("./rule.model")
const RuleVariable = require("./rule-variable.model")
const { buildModelOptions } = require("./model-options")

const RuleCondition = db.define("RuleCondition", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rule_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rule_variable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  field: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  operator: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["=", ">", "<", ">=", "<="]]
    }
  },
}, buildModelOptions("rule_conditions"))

Rule.hasMany(RuleCondition, {
  foreignKey: "rule_id",
  as: "conditions",
  onDelete: "CASCADE"
})
RuleCondition.belongsTo(Rule, {
  foreignKey: "rule_id",
  as: "rule"
})

RuleVariable.hasMany(RuleCondition, {
  foreignKey: "rule_variable_id",
  as: "conditions",
  onDelete: "SET NULL"
})
RuleCondition.belongsTo(RuleVariable, {
  foreignKey: "rule_variable_id",
  as: "ruleVariable"
})

module.exports = RuleCondition
