const { DataTypes } = require("sequelize");
const { db } = require("../config/database");

const User = db.define("users", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    created_at: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: false,
});

module.exports = User;