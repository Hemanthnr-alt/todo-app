import { motion } from "framer-motion";

const PremiumTaskCard = ({ task, onToggle, onDelete, onPriorityChange, onDueDateChange }) => {
  const priorityColors = {
    high: { bg: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.1))", border: "#ef4444", icon: "🔴" },
    medium: { bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1))", border: "#f59e0b", icon: "🟠" },
    low: { bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.1))", border: "#10b981", icon: "🟢" },
  };

  const priority = priorityColors[task.priority] || priorityColors.medium;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        borderRadius: "24px",
        padding: "20px",
        marginBottom: "12px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(task)}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: task.completed 
              ? "linear-gradient(135deg, #10b981, #34d399)"
              : "rgba(255, 255, 255, 0.1)",
            border: task.completed ? "none" : "2px solid rgba(255, 255, 255, 0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {task.completed && <span style={{ color: "white", fontSize: "14px" }}>✓</span>}
        </motion.button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
            <span style={{
              fontSize: "18px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #fff, rgba(255,255,255,0.8))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textDecoration: task.completed ? "line-through" : "none",
              opacity: task.completed ? 0.6 : 1,
            }}>
              {task.title}
            </span>
            
            {task.dueDate && (
              <div style={{
                padding: "4px 12px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span>📅</span>
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}

            <div style={{
              padding: "4px 12px",
              background: priority.bg,
              borderRadius: "20px",
              fontSize: "12px",
              borderLeft: `2px solid ${priority.border}`,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              {priority.icon} {task.priority}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <select
            value={task.priority}
            onChange={(e) => onPriorityChange(task, e.target.value)}
            style={{
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              color: "white",
              fontSize: "12px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟠 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(task.id)}
            style={{
              padding: "8px 16px",
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              color: "#f87171",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            Delete
          </motion.button>
        </div>
      </div>

      {task.dueDate && (
        <div style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <div style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}>
            <input
              type="date"
              value={task.dueDate || ""}
              onChange={(e) => onDueDateChange(task, e.target.value, task.dueTime)}
              style={{
                padding: "6px 10px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "10px",
                color: "white",
                fontSize: "11px",
              }}
            />
            <input
              type="time"
              value={task.dueTime || ""}
              onChange={(e) => onDueDateChange(task, task.dueDate, e.target.value)}
              style={{
                padding: "6px 10px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "10px",
                color: "white",
                fontSize: "11px",
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PremiumTaskCard;