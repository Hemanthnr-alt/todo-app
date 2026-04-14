import { motion } from "framer-motion";

const VARIANTS = {
  primary: {
    background: "linear-gradient(135deg,var(--accent-hover),var(--accent))",
    color: "white", border: "none",
    boxShadow: "var(--shadow-glow)",
  },
  secondary: {
    background: "var(--surface-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  },
  outline: {
    background: "transparent",
    color: "var(--accent)",
    border: "1px solid var(--accent)",
  },
  danger: {
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "white", border: "none",
  },
  success: {
    background: "linear-gradient(135deg,#10b981,#059669)",
    color: "white", border: "none",
  },
};

const SIZES = {
  sm: { padding: "6px 14px",  fontSize: "12px", height: "32px" },
  md: { padding: "10px 20px", fontSize: "14px", height: "44px" },
  lg: { padding: "12px 24px", fontSize: "16px", height: "52px" },
};

const Button = ({
  children, variant = "primary", size = "md",
  onClick, disabled = false, icon, fullWidth = false,
  type = "button", className = "",
}) => {
  const style = {
    ...VARIANTS[variant],
    ...SIZES[size],
    borderRadius: "var(--radius-btn)",   // ← respects button shape setting
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: "6px",
    width: fullWidth ? "100%" : "auto",
    fontFamily: "inherit", transition: "all 0.18s",
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick} disabled={disabled}
      type={type} style={style} className={className}
    >
      {icon && <span style={{ fontSize: "1.1em" }}>{icon}</span>}
      {children}
    </motion.button>
  );
};

export default Button;