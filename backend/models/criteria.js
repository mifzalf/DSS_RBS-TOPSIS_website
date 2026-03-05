const { DataTypes } = require("sequelize");
const { db } = require("../config/database");
const DecisionModel = require("./decisionModel");

const Criteria = db.define("criteria", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING,
  },
  name: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.ENUM("benefit", "cost"),
  },
  weight: {
    type: DataTypes.FLOAT,
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

DecisionModel.hasMany(Criteria, { foreignKey: "decision_model_id" });
Criteria.belongsTo(DecisionModel, { foreignKey: "decision_model_id" });

module.exports = Criteria;