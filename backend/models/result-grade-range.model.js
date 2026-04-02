const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const ResultGradePolicy = require("./result-grade-policy.model")

const ResultGradeRange = db.define("ResultGradeRange", {
   id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
   },
   result_grade_policy_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   label: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         notEmpty: true,
         len: [1, 100]
      }
   },
   code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         notEmpty: true,
         len: [1, 50]
      }
   },
   min_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
         min: 0,
         max: 1
      }
   },
   max_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
         min: 0,
         max: 1
      }
   },
   sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
         min: 1
      }
   },
   created_at: {
      type: DataTypes.DATE
   }
}, buildModelOptions("result_grade_ranges", {
   indexes: [
      {
         name: "rgr_policy_order_idx",
         fields: ["result_grade_policy_id", "sort_order"]
      }
   ]
}))

ResultGradePolicy.hasMany(ResultGradeRange, {
   foreignKey: "result_grade_policy_id",
   as: "ranges",
   onDelete: "CASCADE"
})
ResultGradeRange.belongsTo(ResultGradePolicy, {
   foreignKey: "result_grade_policy_id",
   as: "policy"
})

module.exports = ResultGradeRange
