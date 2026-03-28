import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const Input = ({ label, icon, error, className = "", ...props }) => {
  const { isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: "14px" }} className={className}>
      {label && (
        <label style={{
          display: "block", marginBottom: "6px",
          fontSize: "13px", fontWeight: 500,
          color: isDark ? "#cbd5e1" : "#4a5568",
        }}>{label}</label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && (
          <span style={{
            position: "absolute", left: "12px",
            fontSize: "18px",
            color: focused ? "#ff6b9d" : "#94a3b8",
          }}>{icon}</span>
        )}
        <input
          {...props}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          style={{
            width: "100%",
            padding: icon ? "11px 12px 11px 40px" : "11px 12px",
            borderRadius: "10px",
            border: `1px solid ${focused ? "#ff6b9d" : (isDark ? "#475569" : "#e2e8f0")}`,
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#f8fafc" : "#1a1a2e",
            fontSize: "14px", outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
            ...(props.style || {}),
          }}
        />
      </div>
      {error && <div style={{ marginTop: "5px", fontSize: "12px", color: "#ef4444" }}>{error}</div>}
    </div>
  );
};

export default Input;
