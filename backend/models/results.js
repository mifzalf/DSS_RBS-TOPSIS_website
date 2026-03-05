const { DataTypes } = require("sequelize");
const { db } = require("../config/database");

const DecisionModel = require("./decisionModel");
const Alternative = require("./alternatives");

const Result = db.define("results", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category: {
    type: DataTypes.STRING,
  },
  preference_score: {
    type: DataTypes.FLOAT,
  },
  rank: {
    type: DataTypes.INTEGER,
  },
  iteration: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.STRING,
  },
  created_at: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: false,
});

DecisionModel.hasMany(Result, { foreignKey: "decision_model_id" });
Result.belongsTo(DecisionModel, { foreignKey: "decision_model_id" });

Alternative.hasMany(Result, { foreignKey: "alternative_id" });
Result.belongsTo(Alternative, { foreignKey: "alternative_id" });

module.exports = Result;