import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const PremiumHeader = ({ title, subtitle, icon }) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ textAlign: "center", marginBottom: "40px" }}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ fontSize: "48px", marginBottom: "16px", display: "inline-block" }}
      >
        {icon}
      </motion.div>
      <h1 style={{
        fontSize: "48px",
        fontWeight: "800",
        background: "linear-gradient(135deg, #ff6b9d, #ff99cc, #ffb6c1)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "12px",
      }}>
        {title}
      </h1>
      <p style={{ fontSize: "18px", color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", maxWidth: "600px", margin: "0 auto" }}>
        {subtitle}
      </p>
    </motion.div>
  );
};

export default PremiumHeader;