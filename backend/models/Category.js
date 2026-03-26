const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Category = sequelize.define("Category", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [1, 50] },
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: "#ff6b9d",
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/,
    },
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: "📁",
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "Users", key: "id" },
  },
}, {
  timestamps: true,
});

module.exports = Category;