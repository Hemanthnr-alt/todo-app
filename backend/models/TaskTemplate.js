const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

/** items: [{ title, priority?, tags?, categoryId?, projectId? }] */
const TaskTemplate = sequelize.define("TaskTemplate", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [1, 120] },
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: [],
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

module.exports = TaskTemplate;
