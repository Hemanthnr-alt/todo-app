const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Project = sequelize.define("Project", {
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
  color: {
    type: DataTypes.STRING,
    defaultValue: "#49B9FF",
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: "◇",
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

module.exports = Project;
