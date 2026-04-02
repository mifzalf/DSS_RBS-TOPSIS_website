const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const DecisionModel = require("./decision-model.model")

const AssistanceCategory = db.define("AssistanceCategory", {
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
         len: [1, 50]
      }
   },
   name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         notEmpty: true,
         len: [1, 100]
      }
   },
   description: {
      type: DataTypes.TEXT,
      validate: {
         len: [0, 5000]
      }
   },
   is_ranked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
   },
   status_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
   },
   created_at: {
      type: DataTypes.DATE
   }
}, buildModelOptions("assistance_categories", {
   indexes: [
      {
         name: "ac_decision_model_code_uq",
         unique: true,
         fields: ["decision_model_id", "code"]
      },
      {
         name: "ac_decision_model_name_uq",
         unique: true,
         fields: ["decision_model_id", "name"]
      }
   ]
}))

DecisionModel.hasMany(AssistanceCategory, {
   foreignKey: "decision_model_id",
   as: "assistanceCategories",
   onDelete: "CASCADE"
})
AssistanceCategory.belongsTo(DecisionModel, {
   foreignKey: "decision_model_id",
   as: "decisionModel"
})

module.exports = AssistanceCategory
