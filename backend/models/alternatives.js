const { DataTypes } = require("sequelize");
const { db } = require("../config/database");
const DecisionModel = require("./decisionModel");

const Alternative = db.define("alternatives", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.TEXT,
  },
  created_at: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: false,
});

DecisionModel.hasMany(Alternative, { foreignKey: "decision_model_id" });
Alternative.belongsTo(DecisionModel, { foreignKey: "decision_model_id" });

module.exports = Alternative;