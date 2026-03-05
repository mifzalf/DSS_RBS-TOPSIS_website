const { DataTypes } = require("sequelize");
const { db } = require("../config/database");
const Criteria = require("./criteria");

const SubCriteria = db.define("sub_criteria", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  label: {
    type: DataTypes.STRING,
  },
  value: {
    type: DataTypes.INTEGER,
  },
}, {
  timestamps: false,
});

Criteria.hasMany(SubCriteria, { foreignKey: "criteria_id" });
SubCriteria.belongsTo(Criteria, { foreignKey: "criteria_id" });

module.exports = SubCriteria;