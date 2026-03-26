const nodemailer = require("nodemailer");

// Sanitize HTML to prevent XSS in emails
const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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
    const mailOptions = {
      from: `"TodoPro" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `⏰ Reminder: "${escapeHtml(task.title)}" is due soon!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#080b14;font-family:'DM Sans',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:32px 20px;">

            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#ff99cc);padding:10px 20px;border-radius:12px;margin-bottom:16px;">
                <span style="font-size:20px;font-weight:800;color:white;letter-spacing:-0.04em;">todopro</span>
              </div>
              <h1 style="color:#f1f5f9;font-size:28px;font-weight:800;margin:0;letter-spacing:-0.03em;">
                Task Reminder ⏰
              </h1>
            </div>

            <!-- Card -->
            <div style="background:#0f172a;border-radius:24px;padding:28px;border:1px solid rgba(255,107,157,0.2);margin-bottom:24px;">
              <p style="color:rgba(241,245,249,0.7);font-size:15px;margin:0 0 8px;">Hello <strong style="color:#f1f5f9;">${escapeHtml(userName)}</strong>,</p>
              <p style="color:rgba(241,245,249,0.7);font-size:15px;margin:0 0 24px;">
                Your task is due soon — don't let it slip through!
              </p>

              <!-- Task block -->
              <div style="background:#1e293b;border-radius:16px;padding:20px;border-left:3px solid #ff6b9d;margin-bottom:24px;">
                <h2 style="color:#ff6b9d;font-size:18px;font-weight:700;margin:0 0 16px;">${escapeHtml(task.title)}</h2>
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;color:rgba(241,245,249,0.5);font-size:13px;width:120px;">📅 Due Date</td>
                    <td style="padding:6px 0;color:#f1f5f9;font-size:13px;font-weight:600;">${escapeHtml(String(task.dueDate))}</td>
                  </tr>
                  ${task.startTime ? `
                  <tr>
                    <td style="padding:6px 0;color:rgba(241,245,249,0.5);font-size:13px;">⏰ Time</td>
                    <td style="padding:6px 0;color:#f1f5f9;font-size:13px;font-weight:600;">${escapeHtml(task.startTime)}${task.endTime ? ` – ${escapeHtml(task.endTime)}` : ""}</td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding:6px 0;color:rgba(241,245,249,0.5);font-size:13px;">🎯 Priority</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:600;color:${task.priority === "high" ? "#f43f5e" : task.priority === "medium" ? "#f59e0b" : "#10b981"};">
                      ${escapeHtml(task.priority?.toUpperCase())}
                    </td>
                  </tr>
                  ${task.description ? `
                  <tr>
                    <td style="padding:6px 0;color:rgba(241,245,249,0.5);font-size:13px;vertical-align:top;">📝 Notes</td>
                    <td style="padding:6px 0;color:rgba(241,245,249,0.7);font-size:13px;">${escapeHtml(task.description)}</td>
                  </tr>` : ""}
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}"
                   style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#ff99cc);color:white;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:0.01em;">
                  View Task →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <p style="text-align:center;color:rgba(241,245,249,0.3);font-size:12px;margin:0;">
              TodoPro · You can disable reminders in Settings
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📬 Reminder sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

const sendDailySummary = async (userEmail, userName, tasks) => {
  const completed = tasks.filter((t) => t.completed);
  const pending = tasks.filter((t) => !t.completed);
  const overdue = pending.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
  const completionPct = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  try {
    const mailOptions = {
      from: `"TodoPro" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `📊 Your Daily Summary · ${new Date().toLocaleDateString()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#080b14;font-family:'DM Sans',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:32px 20px;">

            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#ff99cc);padding:10px 20px;border-radius:12px;margin-bottom:16px;">
                <span style="font-size:20px;font-weight:800;color:white;letter-spacing:-0.04em;">todopro</span>
              </div>
              <h1 style="color:#f1f5f9;font-size:28px;font-weight:800;margin:0 0 6px;letter-spacing:-0.03em;">Daily Summary 📊</h1>
              <p style="color:rgba(241,245,249,0.5);font-size:13px;margin:0;">${escapeHtml(dateStr)}</p>
            </div>

            <!-- Greeting -->
            <div style="background:#0f172a;border-radius:24px;padding:28px;border:1px solid rgba(255,107,157,0.2);margin-bottom:16px;">
              <p style="color:rgba(241,245,249,0.7);font-size:15px;margin:0 0 24px;">
                Hey <strong style="color:#f1f5f9;">${escapeHtml(userName)}</strong>, here's how your day looked 👇
              </p>

              <!-- Stats row -->
              <div style="display:table;width:100%;border-collapse:separate;border-spacing:8px;margin-bottom:24px;">
                <div style="display:table-row;">
                  ${[
                    { label: "Completed", value: completed.length, color: "#10b981" },
                    { label: "Pending", value: pending.length, color: "#f59e0b" },
                    { label: "Overdue", value: overdue.length, color: "#f43f5e" },
                  ].map((s) => `
                    <div style="display:table-cell;background:#1e293b;border-radius:16px;padding:16px;text-align:center;width:33%;">
                      <div style="font-size:28px;font-weight:800;color:${s.color};margin-bottom:4px;">${s.value}</div>
                      <div style="font-size:12px;color:rgba(241,245,249,0.5);">${s.label}</div>
                    </div>
                  `).join("")}
                </div>
              </div>

              <!-- Progress bar -->
              <div style="margin-bottom:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <span style="color:rgba(241,245,249,0.6);font-size:13px;">Completion rate</span>
                  <span style="color:#ff6b9d;font-size:13px;font-weight:700;">${completionPct}%</span>
                </div>
                <div style="background:#1e293b;border-radius:4px;height:6px;overflow:hidden;">
                  <div style="background:linear-gradient(90deg,#ff6b9d,#ff99cc);height:100%;width:${completionPct}%;border-radius:4px;"></div>
                </div>
              </div>

              ${pending.length > 0 ? `
              <!-- Pending tasks -->
              <h3 style="color:#f1f5f9;font-size:15px;font-weight:700;margin:0 0 12px;">📋 Still to do</h3>
              ${pending.slice(0, 5).map((t) => `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#1e293b;border-radius:10px;margin-bottom:8px;">
                  <div style="width:8px;height:8px;border-radius:50%;background:${t.priority === "high" ? "#f43f5e" : t.priority === "medium" ? "#f59e0b" : "#10b981"};flex-shrink:0;"></div>
                  <div style="flex:1;">
                    <div style="color:#f1f5f9;font-size:13px;font-weight:500;">${escapeHtml(t.title)}</div>
                    ${t.dueDate ? `<div style="color:rgba(241,245,249,0.4);font-size:11px;margin-top:2px;">Due ${escapeHtml(String(t.dueDate))}</div>` : ""}
                  </div>
                </div>
              `).join("")}
              ${pending.length > 5 ? `<p style="color:rgba(241,245,249,0.4);font-size:12px;text-align:center;margin-top:8px;">+${pending.length - 5} more tasks</p>` : ""}
              ` : `
              <div style="text-align:center;padding:20px;">
                <div style="font-size:36px;margin-bottom:8px;">🎉</div>
                <p style="color:#10b981;font-size:15px;font-weight:600;margin:0;">All done! Amazing work today.</p>
              </div>
              `}

              <!-- CTA -->
              <div style="text-align:center;margin-top:24px;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}"
                   style="display:inline-block;background:linear-gradient(135deg,#ff6b9d,#ff99cc);color:white;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px;">
                  Open TodoPro →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <p style="text-align:center;color:rgba(241,245,249,0.3);font-size:12px;margin:0;">
              TodoPro · You can disable daily summaries in Settings
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📊 Daily summary sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Daily summary error:", error);
    return false;
  }
};

module.exports = { sendTaskReminder, sendDailySummary };