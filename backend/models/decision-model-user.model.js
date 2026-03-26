const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const DecisionModel = require("./decision-model.model")
const User = require("./user.model")

const DecisionModelUser = db.define("DecisionModelUser", {
   id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
   },
   decision_model_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   role: {
      type: DataTypes.ENUM("owner", "editor", "viewer"),
      allowNull: false,
      defaultValue: "viewer"
   },
   created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
   }
}, buildModelOptions("decision_model_users", {
   indexes: [
      {
         unique: true,
         fields: ["decision_model_id", "user_id"]
      }
   ]
}))

DecisionModel.hasMany(DecisionModelUser, {
   foreignKey: "decision_model_id",
   as: "members",
   onDelete: "CASCADE"
})
DecisionModelUser.belongsTo(DecisionModel, {
   foreignKey: "decision_model_id",
   as: "decisionModel"
})

User.hasMany(DecisionModelUser, {
   foreignKey: "user_id",
   as: "memberships",
   onDelete: "CASCADE"
})
DecisionModelUser.belongsTo(User, {
   foreignKey: "user_id",
   as: "user"
})

module.exports = DecisionModelUser
