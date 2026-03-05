const { DataTypes } = require("sequelize");
const { db } = require("../config/database");
const Rule = require("./rules");

const RuleCondition = db.define("rule_conditions", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  field: {
    type: DataTypes.STRING,
  },
  value: {
    type: DataTypes.STRING,
  },
  operator: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: false,
});

Rule.hasMany(RuleCondition, { foreignKey: "rule_id" });
RuleCondition.belongsTo(Rule, { foreignKey: "rule_id" });

module.exports = RuleCondition;