const { DataTypes } = require("sequelize");
const { db } = require("../config/database");

const Alternative = require("./alternatives");
const Criteria = require("./criteria");
const SubCriteria = require("./subCriteria");

const Evaluation = db.define("evaluations", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  timestamps: false,
});

Alternative.hasMany(Evaluation, { foreignKey: "alternative_id" });
Evaluation.belongsTo(Alternative, { foreignKey: "alternative_id" });

Criteria.hasMany(Evaluation, { foreignKey: "criteria_id" });
Evaluation.belongsTo(Criteria, { foreignKey: "criteria_id" });

SubCriteria.hasMany(Evaluation, { foreignKey: "sub_criteria_id" });
Evaluation.belongsTo(SubCriteria, { foreignKey: "sub_criteria_id" });

module.exports = Evaluation;