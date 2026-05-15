const { DataTypes } = require("sequelize")
const { db } = require("../config/database")
const { buildModelOptions } = require("./model-options")

const DecisionModel = require("./decision-model.model")
const User = require("./user.model")

const IMPORT_TYPES = Object.freeze({
   ALTERNATIVES: "alternatives",
   TOPSIS_EVALUATIONS: "topsis_evaluations",
   RULE_EVALUATIONS: "rule_evaluations"
})

const IMPORT_MODES = Object.freeze({
   CREATE_ONLY: "create_only",
   UPSERT: "upsert"
})

const IMPORT_STATUSES = Object.freeze({
   SUCCESS: "success",
   PARTIAL: "partial",
   FAILED: "failed"
})

const IMPORT_TYPE_VALUES = Object.values(IMPORT_TYPES)
const IMPORT_MODE_VALUES = Object.values(IMPORT_MODES)
const IMPORT_STATUS_VALUES = Object.values(IMPORT_STATUSES)

const ImportHistory = db.define("ImportHistory", {
   id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
   },
   decision_model_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },
   import_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         isIn: [IMPORT_TYPE_VALUES]
      }
   },
   mode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         isIn: [IMPORT_MODE_VALUES]
      }
   },
   file_name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
         len: [0, 255]
      }
   },
   total_rows: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
   },
   created_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
   },
   updated_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
   },
   skipped_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
   },
   status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
         isIn: [IMPORT_STATUS_VALUES]
      }
   },
   error_summary: {
      type: DataTypes.TEXT,
      allowNull: true
   },
   duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
   },
   created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
   }
}, buildModelOptions("import_history"))

DecisionModel.hasMany(ImportHistory, {
   foreignKey: "decision_model_id",
   as: "importHistory",
   onDelete: "CASCADE"
})
ImportHistory.belongsTo(DecisionModel, {
   foreignKey: "decision_model_id",
   as: "decisionModel"
})

User.hasMany(ImportHistory, {
   foreignKey: "user_id",
   as: "imports",
   onDelete: "CASCADE"
})
ImportHistory.belongsTo(User, {
   foreignKey: "user_id",
   as: "user"
})

module.exports = ImportHistory
module.exports.IMPORT_TYPES = IMPORT_TYPES
module.exports.IMPORT_MODES = IMPORT_MODES
module.exports.IMPORT_STATUSES = IMPORT_STATUSES
module.exports.IMPORT_TYPE_VALUES = IMPORT_TYPE_VALUES
module.exports.IMPORT_MODE_VALUES = IMPORT_MODE_VALUES
module.exports.IMPORT_STATUS_VALUES = IMPORT_STATUS_VALUES
