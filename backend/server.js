const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { connectDB } = require("./db");
const { protect } = require("./middleware/auth");
const User = require("./models/User");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const categoryRoutes = require("./routes/categories");
const habitRoutes = require("./routes/habits");
const projectRoutes = require("./routes/projects");
const taskTemplateRoutes = require("./routes/taskTemplates");

const { startNotificationScheduler } = require("./services/notificationScheduler");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://todo-app-five-chi-14.vercel.app",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
  "ionic://localhost",
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      /^capacitor:\/\/.*$/.test(origin) ||
      /^ionic:\/\/.*$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false); // Return false instead of an Error to allow cors middleware to handle it gracefully
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", protect, taskRoutes);
app.use("/api/categories", protect, categoryRoutes);
app.use("/api/habits", protect, habitRoutes);
app.use("/api/projects", protect, projectRoutes);
app.use("/api/task-templates", protect, taskTemplateRoutes);

app.put("/api/user/notifications", protect, async (req, res) => {
  try {
    const { emailReminders, dueDateReminders, reminderTime, dailySummary } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.update({
      notificationPreferences: {
        emailReminders: emailReminders ?? true,
        dueDateReminders: dueDateReminders ?? true,
        reminderTime: reminderTime || "1hour",
        dailySummary: dailySummary ?? true,
      },
    });
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      startNotificationScheduler();
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });