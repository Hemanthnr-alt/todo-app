/**
 * Premium SVG chrome + completion styling shared across Tasks, Today, Habits, Calendar.
 */

/** Strikethrough using a soft gradient bar (reads more “designed” than plain line-through). */
export function PremiumCompleteTitle({ children, complete, lineColor, style = {} }) {
  if (!complete) {
    return (
      <span
        style={{
          fontWeight: 600,
          color: "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "block",
          ...style,
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span style={{ position: "relative", display: "block", maxWidth: "100%", ...style }}>
      <span
        style={{
          color: "var(--text-muted)",
          fontWeight: 500,
          letterSpacing: "0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "block",
          opacity: 0.92,
        }}
      >
        {children}
      </span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: "2px",
          marginTop: "-1px",
          borderRadius: "2px",
          background: `linear-gradient(90deg, transparent 0%, ${lineColor}cc 12%, ${lineColor} 50%, ${lineColor}cc 88%, transparent 100%)`,
          boxShadow: `0 0 10px ${lineColor}55`,
          pointerEvents: "none",
        }}
      />
    </span>
  );
}

export function IconCheck({ size = 14, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus({ size = 22, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPencil({ size = 18, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTrash({ size = 18, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch({ size = 18, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke={stroke} strokeWidth="1.85" />
      <path d="M20 20l-3-3" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ size = 16, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconSun({ size = 22, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth="1.85" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" />
    </svg>
  );
}

export function IconMoon({ size = 22, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSettingsGear({ size = 18, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function IconSparkle({ size = 18, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l1.1 4.2L17 8l-3.9 1.8L12 14l-1.1-4.2L7 8l3.9-1.8L12 2z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBell({ size = 18, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconInfo({ size = 18, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.85" />
      <path d="M12 16v-5M12 8h.01" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconFlame({ size = 14, fill = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2c0 4-4 5-4 10a4 4 0 0 0 8 0c0-3-2-4-2-7 2 2 2 5 2 7a6 6 0 1 1-12 0c0-4 3-6 6-10z"
        fill={fill}
        opacity={0.9}
      />
    </svg>
  );
}

export function IconCalendar({ size = 16, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={stroke} strokeWidth="1.75" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconFolder({ size = 16, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

/** Circular complete control with vector check (no text glyph). */
export function PremiumRoundComplete({ checked, onClick, color, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-reset"
      aria-label={ariaLabel}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: checked ? color : "var(--surface-raised)",
        border: `2px solid ${checked ? color : "var(--border-strong)"}`,
        color: checked ? "#fff" : "transparent",
        flexShrink: 0,
        boxShadow: checked ? `0 0 0 3px ${color}28, 0 4px 12px ${color}35` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.15s ease, box-shadow 0.2s ease",
      }}
    >
      {checked ? <IconCheck size={15} stroke="#fff" /> : null}
    </button>
  );
}

export function PremiumIconButton({ onClick, children, label, tone = "muted" }) {
  const color = tone === "accent" ? "var(--accent)" : "var(--text-muted)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-reset"
      aria-label={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {children}
    </button>
  );
}
