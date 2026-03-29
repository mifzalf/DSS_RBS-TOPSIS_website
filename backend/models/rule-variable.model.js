const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const DecisionModel = require("./decision-model.model")
const { buildModelOptions } = require("./model-options")
const { RULE_VARIABLE_TYPE_VALUES } = require("../constants/rule-variable-types")

const RuleVariable = db.define("RuleVariable", {
   id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
   },
   decision_model_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         notEmpty: true,
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
   value_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         isIn: [RULE_VARIABLE_TYPE_VALUES]
      }
   },
   description: {
      type: DataTypes.TEXT,
      validate: {
         len: [0, 5000]
      }
   },
   status_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
   },
   created_at: {
      type: DataTypes.DATE
   }
}, buildModelOptions("rule_variables", {
   indexes: [
      {
         unique: true,
         fields: ["decision_model_id", "code"]
      },
      {
         unique: true,
         fields: ["decision_model_id", "name"]
      }
   ]
}))

DecisionModel.hasMany(RuleVariable, {
   foreignKey: "decision_model_id",
   as: "ruleVariables",
   onDelete: "CASCADE"
})
RuleVariable.belongsTo(DecisionModel, {
   foreignKey: "decision_model_id",
   as: "decisionModel"
})

module.exports = RuleVariable
