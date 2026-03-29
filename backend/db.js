const { Sequelize } = require("sequelize");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },

  pool: {
    max: 5,
    min: 0,
    idle: 10000,
    acquire: 30000,
  },

  define: {
    freezeTableName: true,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected");

    const User     = require("./models/User");
    const Category = require("./models/Category");
    const Task     = require("./models/Task");

    // Associations
    User.hasMany(Task,         { foreignKey: "userId",     onDelete: "CASCADE" });
    Task.belongsTo(User,       { foreignKey: "userId" });

    User.hasMany(Category,     { foreignKey: "userId",     onDelete: "CASCADE" });
    Category.belongsTo(User,   { foreignKey: "userId" });

    Category.hasMany(Task,     { foreignKey: "categoryId", onDelete: "SET NULL" });
    Task.belongsTo(Category,   { foreignKey: "categoryId" });

    // ✅ FIX: Use force:false, alter:false in production with Supabase pooler
    // Instead manually ensure tables exist safely
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // In production: just create tables if they don't exist, never alter
      // This avoids pgBouncer transaction issues with ALTER TABLE
      await sequelize.sync({ force: false, alter: false });
    } else {
      await sequelize.sync({ alter: true });
    }

    console.log("✅ Tables synced");
  } catch (error) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };