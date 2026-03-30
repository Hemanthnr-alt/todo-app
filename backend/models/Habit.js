const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Habit = sequelize.define("Habit", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [1, 100] },
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: "⭐",
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: "#ff6b9d",
  },
  frequency: {
    type: DataTypes.STRING,
    defaultValue: "daily", // daily, weekly, monthly
  },
  completedDates: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "User", key: "id" },
    onDelete: "CASCADE",
  },
}, {
  timestamps: true,
  freezeTableName: true,
});

module.exports = Habit;