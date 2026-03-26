const { Sequelize } = require("sequelize");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set");
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected");

    const User = require("./models/User");
    const Category = require("./models/Category");
    const Task = require("./models/Task");

    User.hasMany(Task, { foreignKey: "userId", onDelete: "CASCADE" });
    Task.belongsTo(User, { foreignKey: "userId" });

    User.hasMany(Category, { foreignKey: "userId", onDelete: "CASCADE" });
    Category.belongsTo(User, { foreignKey: "userId" });

    Category.hasMany(Task, { foreignKey: "categoryId", onDelete: "SET NULL" });
    Task.belongsTo(Category, { foreignKey: "categoryId" });

    const isProduction = process.env.NODE_ENV === "production";
    await sequelize.sync({ alter: !isProduction });
    console.log("✅ Tables synced");
  } catch (error) {
    console.error("❌ Database Error:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };