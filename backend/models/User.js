const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const bcrypt = require("bcryptjs");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [2, 50] },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  avatar: {
    type: DataTypes.TEXT,
    defaultValue: "",
  },
  lastLogin: {
    type: DataTypes.DATE,
  },
  notificationPreferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      emailReminders: true,
      dueDateReminders: true,
      reminderTime: "1hour",
      dailySummary: true,
    },
  },
}, {
  timestamps: true,
  // ✅ FIX: freezeTableName is set globally in sequelize config,
  // but explicitly set here too so table is always "User" not "Users"
  freezeTableName: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed("password")) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;
