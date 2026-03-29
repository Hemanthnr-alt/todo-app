const express = require("express");
const cors    = require("cors");
const path    = require("path");
require("dotenv").config();

const { connectDB }    = require("./db");
const { protect }      = require("./middleware/auth");
const User             = require("./models/User");
const authRoutes       = require("./routes/auth");
const taskRoutes       = require("./routes/tasks");
const categoryRoutes   = require("./routes/categories");
const aiRoutes         = require("./routes/ai");
const { startNotificationScheduler } = require("./services/notificationScheduler");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ✅ CORS middleware — before all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else {
    // In production allow all (you can restrict later)
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
}));


// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/tasks",      protect, taskRoutes);
app.use("/api/categories", protect, categoryRoutes);
app.use("/api/ai",         protect, aiRoutes);   // ← AI proxy (key stays server-side)

// User notification preferences
app.put("/api/user/notifications", protect, async (req, res) => {
  try {
    const { emailReminders, dueDateReminders, reminderTime, dailySummary } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.update({
      notificationPreferences: {
        emailReminders:   emailReminders   ?? true,
        dueDateReminders: dueDateReminders ?? true,
        reminderTime:     reminderTime     || "1hour",
        dailySummary:     dailySummary     ?? true,
      },
    });
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), version: "2.0.0" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  if (err.multer) return res.status(400).json({ error: err.message });
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    startNotificationScheduler();
  });
}).catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
