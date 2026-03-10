const { DataTypes } = require("sequelize");
const { db } = require("../config/database");

const DecisionModel = db.define("decision_model", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descriptions: {
    type: DataTypes.TEXT,
  },
  created_at: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: false,
});

module.exports = DecisionModel;