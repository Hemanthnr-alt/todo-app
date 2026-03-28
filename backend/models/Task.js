const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [1, 255] },
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: "",
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  priority: {
    type: DataTypes.ENUM("high", "medium", "low"),
    defaultValue: "medium",
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  subtasks: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "Users", key: "id" },
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "Categories", key: "id" },
  },
}, { timestamps: true });

module.exports = Task;
