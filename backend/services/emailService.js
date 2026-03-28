const nodemailer = require("nodemailer");

const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendTaskReminder = async (userEmail, userName, task) => {
  try {
    await transporter.sendMail({
      from: `"30" <${process.env.EMAIL_USER}>`,
      to:   userEmail,
      subject: `⏰ Reminder: "${escapeHtml(task.title)}" is due soon!`,
      html: `
        <div style="max-width:600px;margin:0 auto;padding:32px 20px;font-family:'DM Sans',Arial,sans-serif;background:#080b14;color:#f1f5f9;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#ff99cc);padding:10px 20px;border-radius:12px;margin-bottom:12px;">
              <span style="font-size:20px;font-weight:900;color:white;letter-spacing:-0.04em;">30</span>
            </div>
            <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0;">Task Reminder ⏰</h1>
          </div>
          <div style="background:#0f172a;border-radius:20px;padding:24px;border:1px solid rgba(255,107,157,0.2);">
            <p style="color:rgba(241,245,249,0.7);margin:0 0 20px;">
              Hello <strong style="color:#f1f5f9;">${escapeHtml(userName)}</strong>, your task is due soon!
            </p>
            <div style="background:#1e293b;border-radius:12px;padding:18px;border-left:3px solid #ff6b9d;margin-bottom:20px;">
              <h2 style="color:#ff6b9d;font-size:17px;margin:0 0 12px;">${escapeHtml(task.title)}</h2>
              <p style="color:rgba(241,245,249,0.6);font-size:13px;margin:4px 0;">📅 Due: ${escapeHtml(String(task.dueDate))}</p>
              <p style="color:rgba(241,245,249,0.6);font-size:13px;margin:4px 0;">🎯 Priority: ${escapeHtml(task.priority?.toUpperCase())}</p>
            </div>
            <div style="text-align:center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}"
                 style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#ff99cc);color:white;padding:12px 28px;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px;">
                Open 30 →
              </a>
            </div>
          </div>
          <p style="text-align:center;color:rgba(241,245,249,0.3);font-size:12px;margin-top:20px;">
            30 · You can disable reminders in Settings
          </p>
        </div>
      `,
    });
    console.log(`📬 Reminder sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

const sendDailySummary = async (userEmail, userName, tasks) => {
  const completed   = tasks.filter(t => t.completed);
  const pending     = tasks.filter(t => !t.completed);
  const overdue     = pending.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const pct         = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const dateStr     = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  try {
    await transporter.sendMail({
      from: `"30" <${process.env.EMAIL_USER}>`,
      to:   userEmail,
      subject: `📊 Your Daily Summary · ${new Date().toLocaleDateString()}`,
      html: `
        <div style="max-width:600px;margin:0 auto;padding:32px 20px;font-family:'DM Sans',Arial,sans-serif;background:#080b14;color:#f1f5f9;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#ff99cc);padding:8px 18px;border-radius:10px;margin-bottom:12px;">
              <span style="font-size:18px;font-weight:900;color:white;">30</span>
            </div>
            <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0;">Daily Summary 📊</h1>
            <p style="color:rgba(241,245,249,0.5);font-size:12px;margin:6px 0 0;">${dateStr}</p>
          </div>
          <div style="background:#0f172a;border-radius:20px;padding:24px;border:1px solid rgba(255,107,157,0.15);">
            <p style="color:rgba(241,245,249,0.7);margin:0 0 20px;">
              Hey <strong style="color:#f1f5f9;">${escapeHtml(userName)}</strong>, here's your day 👇
            </p>
            <div style="display:flex;gap:10px;margin-bottom:20px;">
              ${[
                { label: "Completed", value: completed.length, color: "#10b981" },
                { label: "Pending",   value: pending.length,   color: "#f59e0b" },
                { label: "Overdue",   value: overdue.length,   color: "#f43f5e" },
              ].map(s => `
                <div style="flex:1;background:#1e293b;border-radius:12px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:800;color:${s.color};">${s.value}</div>
                  <div style="font-size:11px;color:rgba(241,245,249,0.5);">${s.label}</div>
                </div>
              `).join("")}
            </div>
            <div style="margin-bottom:20px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="color:rgba(241,245,249,0.6);font-size:12px;">Completion rate</span>
                <span style="color:#ff6b9d;font-size:12px;font-weight:700;">${pct}%</span>
              </div>
              <div style="background:#1e293b;border-radius:3px;height:5px;overflow:hidden;">
                <div style="background:linear-gradient(90deg,#ff6b9d,#ff99cc);height:100%;width:${pct}%;border-radius:3px;"></div>
              </div>
            </div>
            <div style="text-align:center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}"
                 style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#ff99cc);color:white;padding:12px 28px;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px;">
                Open 30 →
              </a>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`📊 Daily summary sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Daily summary error:", error);
    return false;
  }
};

module.exports = { sendTaskReminder, sendDailySummary };
