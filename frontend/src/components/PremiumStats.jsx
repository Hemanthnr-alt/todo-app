import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const PremiumStats = ({ stats }) => {
  const { isDark } = useTheme();

  const statItems = [
    { label: "Total Tasks", value: stats.total, icon: "📋", color: "#ff6b9d" },
    { label: "Completed", value: stats.completed, icon: "✅", color: "#10b981" },
    { label: "Pending", value: stats.pending, icon: "⏳", color: "#f59e0b" },
    { label: "High Priority", value: stats.highPriority, icon: "🔥", color: "#ef4444" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
      marginBottom: "40px",
    }}>
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          style={{
            background: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "20px",
            textAlign: "center",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)"}`,
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>{item.icon}</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: item.color, marginBottom: "8px" }}>{item.value}</div>
          <div style={{ fontSize: "14px", color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default PremiumStats;