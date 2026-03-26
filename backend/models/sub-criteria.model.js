const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const Criteria = require("./criteria.model")
const { buildModelOptions } = require("./model-options")

const SubCriteria = db.define("SubCriteria", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  criteria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 150]
    }
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
}, buildModelOptions("sub_criteria"))

Criteria.hasMany(SubCriteria, {
  foreignKey: "criteria_id",
  as: "subCriteria",
  onDelete: "CASCADE"
})
SubCriteria.belongsTo(Criteria, {
  foreignKey: "criteria_id",
  as: "criteria"
})

module.exports = SubCriteria
