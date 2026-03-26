const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const DecisionModel = require("./decision-model.model")
const { buildModelOptions } = require("./model-options")

const Alternative = db.define("Alternative", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  decision_model_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 150]
    }
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 5000]
    }
  },
  created_at: {
    type: DataTypes.DATE,
  },
}, buildModelOptions("alternatives"))

DecisionModel.hasMany(Alternative, {
  foreignKey: "decision_model_id",
  as: "alternatives",
  onDelete: "CASCADE"
})
Alternative.belongsTo(DecisionModel, {
  foreignKey: "decision_model_id",
  as: "decisionModel"
})

module.exports = Alternative
