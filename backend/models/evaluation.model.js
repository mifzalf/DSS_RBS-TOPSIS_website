const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const Alternative = require("./alternative.model")
const Criteria = require("./criteria.model")
const SubCriteria = require("./sub-criteria.model")

const Evaluation = db.define("Evaluation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  alternative_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  criteria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sub_criteria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, buildModelOptions("evaluations", {
  indexes: [
    {
      unique: true,
      fields: ["alternative_id", "criteria_id"]
    }
  ]
}))

Alternative.hasMany(Evaluation, {
  foreignKey: "alternative_id",
  as: "evaluations",
  onDelete: "CASCADE"
})
Evaluation.belongsTo(Alternative, {
  foreignKey: "alternative_id",
  as: "alternative"
})

Criteria.hasMany(Evaluation, {
  foreignKey: "criteria_id",
  as: "evaluations",
  onDelete: "CASCADE"
})
Evaluation.belongsTo(Criteria, {
  foreignKey: "criteria_id",
  as: "criteria"
})

SubCriteria.hasMany(Evaluation, {
  foreignKey: "sub_criteria_id",
  as: "evaluations",
  onDelete: "CASCADE"
})
Evaluation.belongsTo(SubCriteria, {
  foreignKey: "sub_criteria_id",
  as: "subCriteria"
})

module.exports = Evaluation
