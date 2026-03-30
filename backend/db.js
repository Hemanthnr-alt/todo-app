const { Sequelize } = require("sequelize");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  pool: { max: 5, min: 0, idle: 10000, acquire: 30000 },
  define: { freezeTableName: true },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected");

    const User     = require("./models/User");
    const Category = require("./models/Category");
    const Task     = require("./models/Task");
    const Habit    = require("./models/Habit");

    User.hasMany(Task,     { foreignKey: "userId",     onDelete: "CASCADE" });
    Task.belongsTo(User,   { foreignKey: "userId" });

    User.hasMany(Category,     { foreignKey: "userId",     onDelete: "CASCADE" });
    Category.belongsTo(User,   { foreignKey: "userId" });

    Category.hasMany(Task, { foreignKey: "categoryId", onDelete: "SET NULL" });
    Task.belongsTo(Category,   { foreignKey: "categoryId" });

    User.hasMany(Habit,    { foreignKey: "userId",     onDelete: "CASCADE" });
    Habit.belongsTo(User,  { foreignKey: "userId" });

    await sequelize.sync({ force: false, alter: false });
    console.log("✅ Tables synced");
  } catch (error) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };