const cron = require("node-cron");
const { sendTaskReminder, sendDailySummary } = require("./emailService");
const User = require("../models/User");
const Task = require("../models/Task");

const checkUpcomingTasks = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const tasksDueTomorrow = await Task.findAll({
      where: { dueDate: tomorrowStr, completed: false, reminderSent: false },
      include: [{ model: User }],
    });

    for (const task of tasksDueTomorrow) {
      if (task.User?.email) {
        const sent = await sendTaskReminder(task.User.email, task.User.name, task);
        if (sent) await task.update({ reminderSent: true });
      }
    }

    console.log(`📬 Sent reminders for ${tasksDueTomorrow.length} tasks`);
  } catch (error) {
    console.error("Error in reminder check:", error);
  }
};

const sendDailySummaries = async () => {
  try {
    const users = await User.findAll();
    const today = new Date().toISOString().split("T")[0];

    for (const user of users) {
      const prefs = user.notificationPreferences || {};
      if (!prefs.dailySummary) continue;

      const tasks = await Task.findAll({
        where: { userId: user.id, dueDate: today },
        order: [["createdAt", "DESC"]],
      });

      await sendDailySummary(user.email, user.name, tasks);
    }

    console.log(`📊 Sent daily summaries to ${users.length} users`);
  } catch (error) {
    console.error("Error sending daily summaries:", error);
  }
};

const startNotificationScheduler = () => {
  // Daily reminders at 9 AM only (not hourly to avoid duplicate emails)
  cron.schedule("0 9 * * *", () => {
    console.log("⏰ Running daily reminder check...");
    checkUpcomingTasks();
  });

  // End-of-day summary at 6 PM
  cron.schedule("0 18 * * *", () => {
    console.log("📊 Running daily summary...");
    sendDailySummaries();
  });

  // Reset reminderSent flags at midnight for next day
  cron.schedule("0 0 * * *", async () => {
    try {
      await Task.update({ reminderSent: false }, { where: { reminderSent: true } });
    } catch (err) {
      console.error("Error resetting reminder flags:", err);
    }
  });

  console.log("🔔 Notification scheduler started");
};

module.exports = { startNotificationScheduler };