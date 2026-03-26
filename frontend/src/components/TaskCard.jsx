import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import Card from "./Card";
import Button from "./Button";
import { borderRadius } from "../config/theme";

const TaskCard = ({ 
  task, 
  onToggle, 
  onDelete, 
  onPriorityChange,
  onDueDateChange,
  onUpload,
  onDeleteAttachment,
  uploadingTaskId,
  selectedFile,
  setSelectedFile,
  setUploadingTaskId,
  uploadFile,
  getCategory,
  getPriorityStyle,
  formatDueDate,
  isOverdue,
  getFileIcon,
  formatFileSize,
}) => {
  const { isDark } = useTheme();
  const priorityStyle = getPriorityStyle(task.priority);
  const category = getCategory(task.categoryId);
  const dueDateFormatted = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate) && !task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
    >
      <Card hover={false}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          {/* Left Section */}
          <div style={{ display: "flex", gap: "12px", flex: 1 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggle(task)}
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                border: `2px solid ${task.completed ? "#10b981" : (isDark ? "#475569" : "#cbd5e1")}`,
                background: task.completed ? "#10b981" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "2px",
                flexShrink: 0,
              }}
            >
              {task.completed && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
            </motion.button>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                <span style={{
                  fontSize: "16px",
                  fontWeight: "500",
                  color: isDark ? "#f8fafc" : "#1a1a2e",
                  textDecoration: task.completed ? "line-through" : "none",
                  opacity: task.completed ? 0.6 : 1,
                }}>
                  {task.title}
                </span>

                {task.dueDate && (
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    background: overdue ? "#fee2e2" : (isDark ? "#334155" : "#e6f7ff"),
                    color: overdue ? "#ef4444" : "#3b82f6",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                    📅 {dueDateFormatted}
                    {task.dueTime && ` at ${task.dueTime}`}
                    {overdue && " ⚠️"}
                  </span>
                )}

                <span style={{
                  padding: "2px 8px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  background: priorityStyle.bg,
                  color: priorityStyle.color,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  {priorityStyle.icon} {priorityStyle.label}
                </span>

                {category && (
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    background: `${category.color}20`,
                    color: category.color,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                    {category.icon} {category.name}
                  </span>
                )}
              </div>

              {/* Attachments Section */}
              {task.attachments && task.attachments.length > 0 && (
                <div style={{
                  marginTop: "12px",
                  padding: "8px",
                  background: isDark ? "#0f172a" : "#f8f9fa",
                  borderRadius: borderRadius.md,
                  border: `1px solid ${isDark ? "#334155" : "#e9ecef"}`,
                }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "6px" }}>
                    📎 Attachments ({task.attachments.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {task.attachments.map(att => (
                      <div key={att.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        padding: "4px 0",
                      }}>
                        <span>{getFileIcon(att.mimeType)}</span>
                        <a 
                          href={att.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: "#ff6b9d",
                            textDecoration: "none",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {att.originalName.length > 30 ? att.originalName.substring(0, 27) + "..." : att.originalName}
                        </a>
                        <span style={{ fontSize: "10px", color: isDark ? "#94a3b8" : "#64748b" }}>
                          ({formatFileSize(att.size)})
                        </span>
                        <button
                          onClick={() => onDeleteAttachment(task.id, att.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontSize: "12px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <input
                  type="file"
                  id={`file-upload-${task.id}`}
                  style={{ display: "none" }}
                  onChange={(e) => onUpload(task.id, e)}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  icon="📎"
                  onClick={() => document.getElementById(`file-upload-${task.id}`).click()}
                >
                  Attach File
                </Button>
                {uploadingTaskId === task.id && selectedFile && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 8px",
                    background: isDark ? "#334155" : "#f1f3f5",
                    borderRadius: borderRadius.md,
                  }}>
                    <span style={{ fontSize: "11px" }}>{selectedFile.name}</span>
                    <Button size="sm" variant="success" onClick={uploadFile}>Upload</Button>
                    <Button size="sm" variant="danger" onClick={() => { setSelectedFile(null); setUploadingTaskId(null); }}>Cancel</Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="date"
                value={task.dueDate || ""}
                onChange={(e) => onDueDateChange(task, e.target.value, task.dueTime)}
                style={{
                  padding: "6px 8px",
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                  background: isDark ? "#1e293b" : "#ffffff",
                  color: isDark ? "#f8fafc" : "#1a1a2e",
                  fontSize: "11px",
                  width: "100px",
                }}
              />
              <input
                type="time"
                value={task.dueTime || ""}
                onChange={(e) => onDueDateChange(task, task.dueDate, e.target.value)}
                style={{
                  padding: "6px 8px",
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                  background: isDark ? "#1e293b" : "#ffffff",
                  color: isDark ? "#f8fafc" : "#1a1a2e",
                  fontSize: "11px",
                  width: "70px",
                }}
              />
            </div>
            <select
              value={task.priority}
              onChange={(e) => onPriorityChange(task, e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: borderRadius.sm,
                border: `1px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                background: isDark ? "#1e293b" : "#ffffff",
                color: isDark ? "#f8fafc" : "#1a1a2e",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟠 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <Button size="sm" variant="danger" onClick={() => onDelete(task.id)}>
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TaskCard;