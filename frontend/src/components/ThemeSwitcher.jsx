import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const ThemeSwitcher = () => {
  const { toggleTheme, isDark } = useTheme();
  return (
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 16px", borderRadius: "40px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        cursor: "pointer",
        color: isDark ? "white" : "#1e293b",
        fontSize: "14px", fontWeight: 500, fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: "16px" }}>{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </motion.button>
  );
};

export default ThemeSwitcher;
