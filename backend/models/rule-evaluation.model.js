const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const Alternative = require("./alternative.model")
const RuleVariable = require("./rule-variable.model")

const RuleEvaluation = db.define("RuleEvaluation", {
   id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
   },
   alternative_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   rule_variable_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   value_boolean: {
      type: DataTypes.BOOLEAN,
      allowNull: true
   },
   value_number: {
      type: DataTypes.FLOAT,
      allowNull: true
   },
   value_string: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
         len: [0, 255]
      }
   },
   created_at: {
      type: DataTypes.DATE
   }
}, buildModelOptions("rule_evaluations", {
   indexes: [
      {
         unique: true,
         fields: ["alternative_id", "rule_variable_id"]
      }
   ]
}))

Alternative.hasMany(RuleEvaluation, {
   foreignKey: "alternative_id",
   as: "ruleEvaluations",
   onDelete: "CASCADE"
})
RuleEvaluation.belongsTo(Alternative, {
   foreignKey: "alternative_id",
   as: "alternative"
})

RuleVariable.hasMany(RuleEvaluation, {
   foreignKey: "rule_variable_id",
   as: "evaluations",
   onDelete: "CASCADE"
})
RuleEvaluation.belongsTo(RuleVariable, {
   foreignKey: "rule_variable_id",
   as: "ruleVariable"
})

module.exports = RuleEvaluation
