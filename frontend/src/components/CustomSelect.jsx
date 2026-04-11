import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "./Portal";
import { useTheme } from "../context/ThemeContext";

/**
 * Custom Select component rendered via Portal.
 * Replaces the native <select> to avoid the OS-native white dropdown in dark mode.
 *
 * Usage:
 *   <CustomSelect
 *     value={priority}
 *     onChange={setPriority}
 *     options={[
 *       { value: "high",   label: "🔴 High" },
 *       { value: "medium", label: "🟡 Medium" },
 *       { value: "low",    label: "🟢 Low" },
 *     ]}
 *   />
 */
export default function CustomSelect({ value, onChange, options, style = {}, placeholder = "Select…" }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  const selected = options.find(o => o.value === value);

  const textColor  = "var(--text-primary)";
  const mutedColor = "var(--text-muted)";
  const bg         = "var(--surface-elevated)";
  const border     = "var(--border)";
  const hoverBg    = "var(--surface-raised)";
  const triggerBg  = "var(--surface)";

  const openDropdown = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const baseStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "10px",
    border: `1px solid ${border}`,
    background: triggerBg,
    color: textColor,
    fontSize: "13px",
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    userSelect: "none",
    transition: "border-color 0.15s",
    ...style,
  };

  return (
    <>
      {/* Trigger button */}
      <div
        ref={triggerRef}
        onClick={openDropdown}
        style={baseStyle}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = border}
      >
        <span style={{ minWidth: 0, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : <span style={{ color: mutedColor }}>{placeholder}</span>}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ fontSize: "10px", color: mutedColor, flexShrink: 0 }}
        >▼</motion.span>
      </div>

      {/* Dropdown via Portal */}
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              key="custom-select-dropdown"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 340 }}
              style={{
                position: "fixed",
                top: dropPos.top,
                left: dropPos.left,
                width: Math.max(dropPos.width || 0, 220),
                maxWidth: "min(100vw - 24px, 420px)",
                background: bg,
                borderRadius: "12px",
                border: `1px solid ${border}`,
                boxShadow: "0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px var(--border)",
                zIndex: 99999,
                overflow: "hidden",
                fontFamily: "var(--font-body)",
              }}
            >
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    style={{
                      padding: "10px 14px",
                      fontSize: "13px",
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? "var(--accent)" : textColor,
                      background: isActive ? "var(--accent-subtle)" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.12s",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    {isActive && (
                      <span style={{ fontSize: "10px", color: "var(--accent)", flexShrink: 0 }}>✓</span>
                    )}
                    {!isActive && <span style={{ width: "14px", flexShrink: 0 }} />}
                    {opt.label}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
