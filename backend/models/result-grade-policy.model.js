const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const DecisionModel = require("./decision-model.model")
const AssistanceCategory = require("./assistance-category.model")

const ResultGradePolicy = db.define("ResultGradePolicy", {
   id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
   },
   decision_model_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   applies_to_status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         isIn: [["ranked", "rejected"]]
      }
   },
   created_at: {
      type: DataTypes.DATE
   }
}, buildModelOptions("result_grade_policies", {
   indexes: [
       {
          name: "rgp_scope_unique",
          unique: true,
          fields: ["decision_model_id", "category_id", "applies_to_status"]
       }
    ]
}))

DecisionModel.hasMany(ResultGradePolicy, {
   foreignKey: "decision_model_id",
   as: "resultGradePolicies",
   onDelete: "CASCADE"
})
ResultGradePolicy.belongsTo(DecisionModel, {
   foreignKey: "decision_model_id",
   as: "decisionModel"
})

AssistanceCategory.hasMany(ResultGradePolicy, {
   foreignKey: "category_id",
   as: "gradePolicies",
   onDelete: "SET NULL"
})
ResultGradePolicy.belongsTo(AssistanceCategory, {
   foreignKey: "category_id",
   as: "categoryRef"
})

module.exports = ResultGradePolicy
