const { DataTypes } = require("sequelize");
const { db } = require("../config/database");
const DecisionModel = require("./decisionModel");

const Rule = db.define("rules", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  priority: {
    type: DataTypes.INTEGER,
  },
  logic_type: {
    type: DataTypes.ENUM("AND", "OR"),
  },
  action_type: {
    type: DataTypes.STRING,
  },
  target_category: {
    type: DataTypes.STRING,
  },
  status_active: {
    type: DataTypes.BOOLEAN,
  },
  created_at: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: false,
});

DecisionModel.hasMany(Rule, { foreignKey: "decision_model_id" });
Rule.belongsTo(DecisionModel, { foreignKey: "decision_model_id" });

module.exports = Rule;