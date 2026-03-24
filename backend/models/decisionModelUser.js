const { DataTypes } = require("sequelize")
const { db } = require("../config/database")

const DecisionModel = require("./decisionModel")
const User = require("./users")

const DecisionModelUser = db.define("decision_model_users", {
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
}, {
   timestamps: false,
   indexes: [
      {
         unique: true,
         fields: ["decision_model_id", "user_id"]
      }
   ]
})

DecisionModel.hasMany(DecisionModelUser, {
   foreignKey: "decision_model_id",
   as: "members",
   onDelete: "CASCADE"
})
DecisionModelUser.belongsTo(DecisionModel, {
   foreignKey: "decision_model_id"
})

User.hasMany(DecisionModelUser, {
   foreignKey: "user_id",
   as: "decisionModels",
   onDelete: "CASCADE"
})
DecisionModelUser.belongsTo(User, {
   foreignKey: "user_id"
})

module.exports = DecisionModelUser
