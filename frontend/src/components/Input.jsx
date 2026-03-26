import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { borderRadius } from "../config/theme";

const Input = ({ 
  label, 
  icon, 
  error, 
  className = "", 
  ...props 
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const styles = {
    container: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontSize: "13px",
      fontWeight: "500",
      color: isDark ? "#cbd5e1" : "#4a5568",
    },
    inputWrapper: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    input: {
      width: "100%",
      padding: icon ? "12px 12px 12px 40px" : "12px 12px",
      borderRadius: borderRadius.md,
      border: `1px solid ${isFocused ? "#ff6b9d" : (isDark ? "#475569" : "#e2e8f0")}`,
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      color: isDark ? "#f8fafc" : "#1a1a2e",
      fontSize: "14px",
      outline: "none",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
    },
    icon: {
      position: "absolute",
      left: "12px",
      fontSize: "18px",
      color: isFocused ? "#ff6b9d" : (isDark ? "#94a3b8" : "#94a3b8"),
    },
    error: {
      marginTop: "6px",
      fontSize: "12px",
      color: "#ef4444",
    },
  };

  return (
    <div style={styles.container} className={className}>
      {label && <label style={styles.label}>{label}</label>}
      <div style={styles.inputWrapper}>
        {icon && <span style={styles.icon}>{icon}</span>}
        <input
          {...props}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
        />
      </div>
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
};

export default Input;