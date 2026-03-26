const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const DecisionModel = db.define("DecisionModel", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 150]
    }
  },
  descriptions: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 5000]
    }
  },
  created_at: {
    type: DataTypes.DATE,
  },
}, buildModelOptions("decision_model"))

module.exports = DecisionModel
