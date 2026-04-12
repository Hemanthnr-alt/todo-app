import { motion } from "framer-motion";

/**
 * PremiumChrome.jsx — Clean, minimal component library
 * Strikethrough: simple white line, smooth Framer Motion, no goofy colors
 */

// ── Strikethrough title ────────────────────────────────────────────────────────
export function PremiumCompleteTitle({ children, complete, lineColor, style = {} }) {
  return (
    <span style={{ position:"relative", display:"block", maxWidth:"100%", ...style }}>
      {/* text */}
      <motion.span
        animate={{
          opacity: complete ? 0.42 : 1,
          color:   complete ? "var(--text-muted)" : "var(--text-primary)",
        }}
        transition={{ duration:0.20, ease:[0.22,1,0.36,1] }}
        style={{
          fontWeight: complete ? 500 : 600,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          display:"block",
        }}
      >
        {children}
      </motion.span>

      {/* clean strike line — just rgba white/dark, no color glow */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scaleX: complete ? 1 : 0, opacity: complete ? 1 : 0 }}
        transition={{ duration:0.22, ease:[0.22,1,0.36,1] }}
        style={{
          position:"absolute", left:0, right:0, top:"50%",
          height:"1.5px", marginTop:"-0.75px", borderRadius:"999px",
          background:"var(--text-secondary)",
          pointerEvents:"none", transformOrigin:"left center",
        }}
      />
    </span>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
export function IconCheck({ size=14, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconPlus({ size=22, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" stroke={stroke} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" stroke={stroke} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconPencil({ size=18, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconTrash({ size=18, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconSearch({ size=18, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke={stroke} strokeWidth="1.85"/>
      <path d="M20 20l-3-3" stroke={stroke} strokeWidth="1.85" strokeLinecap="round"/>
    </svg>
  );
}

export function IconClose({ size=16, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconSun({ size=20, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth="1.85"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={stroke} strokeWidth="1.85" strokeLinecap="round"/>
    </svg>
  );
}

export function IconMoon({ size=20, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconUltraDark({ size=20, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.85"/>
      <path d="M12 3v18M3 12h9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 3a9 9 0 0 0 0 18" fill={stroke} fillOpacity="0.18"/>
    </svg>
  );
}

export function IconSettingsGear({ size=18, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export function IconSparkle({ size=18, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l1.1 4.2L17 8l-3.9 1.8L12 14l-1.1-4.2L7 8l3.9-1.8L12 2z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconBell({ size=18, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconInfo({ size=18, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.85"/>
      <path d="M12 16v-5M12 8h.01" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconFlame({ size=14, fill="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2c0 4-4 5-4 10a4 4 0 0 0 8 0c0-3-2-4-2-7 2 2 2 5 2 7a6 6 0 1 1-12 0c0-4 3-6 6-10z" fill={fill} opacity="0.9"/>
    </svg>
  );
}

export function IconCalendar({ size=16, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={stroke} strokeWidth="1.75"/>
      <path d="M3 10h18M8 3v4M16 3v4" stroke={stroke} strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  );
}

export function IconFolder({ size=16, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconRepeat({ size=16, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 1l4 4-4 4" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconBarChart({ size=16, stroke="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" stroke={stroke} strokeWidth="1.85" strokeLinecap="round"/>
      <line x1="12" y1="20" x2="12" y2="4"  stroke={stroke} strokeWidth="1.85" strokeLinecap="round"/>
      <line x1="6"  y1="20" x2="6"  y2="14" stroke={stroke} strokeWidth="1.85" strokeLinecap="round"/>
    </svg>
  );
}

// ── Round complete button ───────────────────────────────────────────────────────
export function PremiumRoundComplete({ checked, onClick, color, ariaLabel }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale:0.88 }}
      className="btn-reset"
      aria-label={ariaLabel}
      style={{
        width:32, height:32, borderRadius:"50%",
        background: checked ? color : "transparent",
        border: `2px solid ${checked ? color : "var(--border-strong)"}`,
        color: "#fff", flexShrink:0,
        boxShadow: checked ? `0 0 0 3px ${color}20` : "none",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"background 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
      }}
    >
      {checked && (
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:500,damping:22}}>
          <IconCheck size={14} stroke="#fff"/>
        </motion.div>
      )}
    </motion.button>
  );
}

// ── Icon button ────────────────────────────────────────────────────────────────
export function PremiumIconButton({ onClick, children, label, tone="muted" }) {
  const color = tone==="accent" ? "var(--accent)" : "var(--text-muted)";
  return (
    <button type="button" onClick={onClick} className="btn-reset" aria-label={label}
      style={{ width:34, height:34, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", color, background:"var(--surface-raised)", border:"1px solid var(--border)" }}>
      {children}
    </button>
  );
}

// ── Habit icon tile with SVG icons ──────────────────────────────────────────────
// SVG icon keys
export const HABIT_ICONS = {
  // ── Fitness & Movement ───────────────────────────────────────────────────
  water:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6 10 4 14 4 17a8 8 0 0 0 16 0c0-3-2-7-8-15z" fill={c} opacity=".9"/></svg>,
  run:       (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM5.5 18l3-5 3 2 2-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 12l-2-3-2 1-1-3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  gym:       (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5h1v11h-1zM16.5 6.5h1v11h-1zM6.5 11.5h11M2.5 9h4M17.5 9h4M2.5 15h4M17.5 15h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  walk:      (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="1.5" fill={c}/><path d="M9 9l1 6-3 6M15 9l-1 6 3 6M9 9h6l1-4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bike:      (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="18.5" cy="17.5" r="3.5" stroke={c} strokeWidth="1.8"/><circle cx="5.5" cy="17.5" r="3.5" stroke={c} strokeWidth="1.8"/><path d="M15 6h2l2 4M5.5 17.5L9 10h4l4 7.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  swim:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M2 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="5" r="2" stroke={c} strokeWidth="1.8"/></svg>,
  yoga:      (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="3" r="1.5" fill={c}/><path d="M12 5v5M9 10H6l2 5h8l2-5h-3M9 15l-2 5M15 15l2 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  stretch:   (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="1.5" fill={c}/><path d="M12 6v4M7 14l5-4 5 4M7 14l-2 6M17 14l2 6M7 14h10" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  steps:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4v-4H4zM10 20h4v-8h-4zM16 20h4V8h-4M4 12h4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  hike:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M3 20l4-8 3 3 4-6 4 4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="18" cy="5" r="2" stroke={c} strokeWidth="1.8"/></svg>,
  // ── Wellness & Health ────────────────────────────────────────────────────
  sleep:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={c} opacity=".9"/></svg>,
  meditate:  (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6" r="2" fill={c}/><path d="M6 20s1-5 6-5 6 5 6 5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M3 15c1.5-1 3-1 4 0M21 15c-1.5-1-3-1-4 0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  heart:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={c} opacity=".9"/></svg>,
  pill:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M10.5 20.5L3.5 13.5a5 5 0 0 1 7.07-7.07l7 7a5 5 0 0 1-7.07 7.07z" stroke={c} strokeWidth="1.8"/><line x1="8.5" y1="11.5" x2="14.5" y2="17.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  weight:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M2 20h20M6 20V10M18 20V10M12 20V4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M9 10h6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  breath:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.8"/></svg>,
  no_smoke:  (c) => <svg viewBox="0 0 24 24" fill="none"><line x1="2" y1="2" x2="22" y2="22" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12h8v2H12M4 12h4v2H4M19 10v2M21 5c-1 0-2 1-2 2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  no_drink:  (c) => <svg viewBox="0 0 24 24" fill="none"><line x1="2" y1="2" x2="22" y2="22" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M8 8H5l1 10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l.5-5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // ── Mind & Productivity ──────────────────────────────────────────────────
  book:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  journal:   (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><line x1="8" y1="13" x2="16" y2="13" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="17" x2="12" y2="17" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  code:      (c) => <svg viewBox="0 0 24 24" fill="none"><polyline points="16 18 22 12 16 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 6 2 12 8 18" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  study:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  think:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.8"/><line x1="12" y1="17" x2="12.01" y2="17" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></svg>,
  focus:     (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill={c} opacity=".8"/><circle cx="12" cy="12" r="7" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="12" r="11" stroke={c} strokeWidth="1.2" opacity=".4"/></svg>,
  learn:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M2 7l10-5 10 5-10 5z" fill={c} opacity=".25" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 12l10 5 10-5M22 7v5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // ── Nutrition & Food ─────────────────────────────────────────────────────
  food:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  salad:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 22C6 22 2 17 2 12h20c0 5-4 10-10 10z" fill={c} opacity=".2" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 12C12 7 15 3 20 2c0 5-3 9-8 10z" fill={c} opacity=".3" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 12C12 7 9 3 4 2c0 5 3 9 8 10z" fill={c} opacity=".3" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  tea:       (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M17 8h1a4 4 0 0 1 0 8h-1" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M7 4c0-1 1-2 1-3M11 4c0-1 1-2 1-3" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  smoothie:  (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M5 3h14l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 3z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M4 3h16M10 19v2M14 19v2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  // ── Creativity & Hobbies ─────────────────────────────────────────────────
  music:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="3" stroke={c} strokeWidth="1.8"/><circle cx="18" cy="16" r="3" stroke={c} strokeWidth="1.8"/></svg>,
  art:       (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.8"/><path d="M12 2a10 10 0 0 1 0 20C7 22 2 17 2 12" stroke={c} strokeWidth="1.8"/><circle cx="8.5" cy="9" r="1.5" fill={c}/><circle cx="15.5" cy="9" r="1.5" fill={c}/><circle cx="12" cy="14" r="1.5" fill={c}/></svg>,
  guitar:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M9 3l-6 6 9 9 6-6-9-9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M15 3l6 6M9 12l-6 6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="2" fill={c} opacity=".7"/></svg>,
  write:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 20h9" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  photo:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke={c} strokeWidth="1.8"/></svg>,
  game:      (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="3" stroke={c} strokeWidth="1.8"/><path d="M6 12h4M8 10v4M15 11h2M15 13h2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  // ── Home & Life ───────────────────────────────────────────────────────────
  plant:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 22v-8M12 14c0-4 3-7 8-8-1 5-4 8-8 8zM12 14c0-4-3-7-8-8 1 5 4 8 8 8z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clean:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M3 22l9-9M15 2l7 7-1.5 1.5M11 6L6 11l5 5 5-5-5-5z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cook:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M9 11l-4 4 1.4 1.4A6 6 0 0 0 15 15l5-5-1-1a6 6 0 0 0-8.49 0L9 11zM7 21h10" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3v2M5.5 5.5l1.5 1.5M18.5 5.5l-1.5 1.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  shop:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke={c} strokeWidth="1.8"/><path d="M16 10a4 4 0 0 1-8 0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  pet:       (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="4.5" cy="9.5" r="1.5" fill={c}/><circle cx="9" cy="5.5" r="1.5" fill={c}/><circle cx="15" cy="5.5" r="1.5" fill={c}/><circle cx="19.5" cy="9.5" r="1.5" fill={c}/><path d="M12 22c-4 0-8-2-8-7 0-2 1-3 2-4l1-2h10l1 2c1 1 2 2 2 4 0 5-4 7-8 7z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  // ── Social & Spiritual ────────────────────────────────────────────────────
  social:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth="1.8"/><circle cx="9" cy="7" r="4" stroke={c} strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  call:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 23 19z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  pray:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M18 2l-6 7-6-7M12 9v13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="4" r="2" stroke={c} strokeWidth="1.8"/></svg>,
  grateful:  (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4.5 8-11.8A8 8 0 0 0 4.4 5.6L3 7M12 22s-8-4.5-8-11.8A8 8 0 0 1 19.6 5.6L21 7" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 8v8M9 11l3-3 3 3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // ── Finance ───────────────────────────────────────────────────────────────
  save:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><polyline points="17 21 17 13 7 13 7 21" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><polyline points="7 3 7 8 15 8" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  money:     (c) => <svg viewBox="0 0 24 24" fill="none"><line x1="12" y1="1" x2="12" y2="23" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  // ── Misc ──────────────────────────────────────────────────────────────────
  star:      (c) => <svg viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={c} opacity=".9"/></svg>,
  sun:       (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill={c} opacity=".8"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  moon:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={c} strokeWidth="1.8" fill={c} fillOpacity=".2"/></svg>,
  fire:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2c0 4-4 5-4 10a4 4 0 0 0 8 0c0-3-2-4-2-7 2 2 2 5 2 7a6 6 0 1 1-12 0c0-4 3-6 6-10z" fill={c} opacity=".9"/></svg>,
  lightning: (c) => <svg viewBox="0 0 24 24" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={c} opacity=".9"/></svg>,
  trophy:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 5h12v7a6 6 0 0 1-12 0V5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 18v3M8 21h8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  clock:     (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  target:    (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="12" r="6" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="12" r="2" fill={c} opacity=".8"/></svg>,
  default:   (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill={c} opacity=".85"/></svg>,
};

export const HABIT_ICON_LIST = Object.keys(HABIT_ICONS);

// ── Habit tile with SVG icon ───────────────────────────────────────────────────
export function HabitIconTile({ iconKey="default", color="#FF7A59", size=44 }) {
  const iconFn = HABIT_ICONS[iconKey] || HABIT_ICONS.default;
  const r = Math.round(size * 0.28);
  return (
    <div style={{
      width:size, height:size, borderRadius:r, flexShrink:0,
      background:`${color}22`,
      border:`1.5px solid ${color}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding: Math.round(size*0.20),
    }}>
      <div style={{ width:"100%", height:"100%", color }}>
        {iconFn(color)}
      </div>
    </div>
  );
}

// Category/task icon tile
export const TASK_ICONS = {
  // ── Core ─────────────────────────────────────────────────────────────────
  default:   (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" fill={c} opacity=".85"/></svg>,
  check:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  repeat:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  star:      (c) => <svg viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={c} opacity=".9"/></svg>,
  target:    (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.85"/><circle cx="12" cy="12" r="6" stroke={c} strokeWidth="1.85"/><circle cx="12" cy="12" r="2" fill={c} opacity=".8"/></svg>,
  flag:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill={c} opacity=".2" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><line x1="4" y1="22" x2="4" y2="15" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  // ── Work & Career ─────────────────────────────────────────────────────────
  work:      (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke={c} strokeWidth="1.85"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  email:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  meeting:   (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="1.85"/><line x1="16" y1="2" x2="16" y2="6" stroke={c} strokeWidth="1.85" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke={c} strokeWidth="1.85" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth="1.85"/></svg>,
  report:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><line x1="8" y1="13" x2="16" y2="13" stroke={c} strokeWidth="1.85" strokeLinecap="round"/><line x1="8" y1="17" x2="12" y2="17" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  code:      (c) => <svg viewBox="0 0 24 24" fill="none"><polyline points="16 18 22 12 16 6" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 6 2 12 8 18" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  design:    (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.85"/><path d="M12 2a10 10 0 0 1 0 20C7 22 2 17 2 12" stroke={c} strokeWidth="1.85"/><circle cx="8.5" cy="9" r="1.5" fill={c}/><circle cx="15.5" cy="9" r="1.5" fill={c}/><circle cx="12" cy="14" r="1.5" fill={c}/></svg>,
  present:   (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke={c} strokeWidth="1.85"/><path d="M8 21h8M12 17v4" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  // ── Education & Learning ──────────────────────────────────────────────────
  study:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  book:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  pen:       (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 20h9" stroke={c} strokeWidth="1.85" strokeLinecap="round"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  research:  (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.85"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke={c} strokeWidth="1.85" strokeLinecap="round"/><path d="M11 8v6M8 11h6" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  // ── Home & Errands ────────────────────────────────────────────────────────
  home:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  shop:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke={c} strokeWidth="1.85"/><path d="M16 10a4 4 0 0 1-8 0" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  cart:      (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1" fill={c}/><circle cx="20" cy="21" r="1" fill={c}/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clean:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M3 22l9-9M15 2l7 7-1.5 1.5M11 6L6 11l5 5 5-5-5-5z" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  tools:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // ── Health & Fitness ──────────────────────────────────────────────────────
  health:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  gym:       (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5h1v11h-1zM16.5 6.5h1v11h-1zM6.5 11.5h11M2.5 9h4M17.5 9h4M2.5 15h4M17.5 15h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  run:       (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM5.5 18l3-5 3 2 2-4M16 12l-2-3-2 1-1-3" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  doctor:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/><circle cx="19" cy="5" r="3" stroke={c} strokeWidth="1.85"/><path d="M19 4v2M18 5h2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  // ── Social & Personal ─────────────────────────────────────────────────────
  social:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth="1.85"/><circle cx="9" cy="7" r="4" stroke={c} strokeWidth="1.85"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  call:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  gift:      (c) => <svg viewBox="0 0 24 24" fill="none"><polyline points="20 12 20 22 4 22 4 12" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><rect x="2" y="7" width="20" height="5" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><line x1="12" y1="22" x2="12" y2="7" stroke={c} strokeWidth="1.85"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  // ── Travel & Places ───────────────────────────────────────────────────────
  travel:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  flight:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill={c} opacity=".8"/></svg>,
  map:       (c) => <svg viewBox="0 0 24 24" fill="none"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="18" stroke={c} strokeWidth="1.85"/><line x1="16" y1="6" x2="16" y2="22" stroke={c} strokeWidth="1.85"/></svg>,
  // ── Finance ───────────────────────────────────────────────────────────────
  finance:   (c) => <svg viewBox="0 0 24 24" fill="none"><line x1="12" y1="1" x2="12" y2="23" stroke={c} strokeWidth="1.85" strokeLinecap="round"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  bank:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M3 22h18M3 10h18M5 10V6M19 10V6M12 10V6M2 6l10-4 10 4M4 22v-4M20 22v-4M12 22v-4M8 22v-4M16 22v-4" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  invest:    (c) => <svg viewBox="0 0 24 24" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 6 23 6 23 12" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // ── Tech ──────────────────────────────────────────────────────────────────
  phone:     (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke={c} strokeWidth="1.85"/><line x1="12" y1="18" x2="12.01" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></svg>,
  laptop:    (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke={c} strokeWidth="1.85"/><path d="M1 21h22" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  wifi:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0" stroke={c} strokeWidth="1.85" strokeLinecap="round"/><circle cx="12" cy="20" r="1" fill={c}/></svg>,
  // ── Misc & Creative ───────────────────────────────────────────────────────
  music:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="3" stroke={c} strokeWidth="1.85"/><circle cx="18" cy="16" r="3" stroke={c} strokeWidth="1.85"/></svg>,
  camera:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke={c} strokeWidth="1.85"/></svg>,
  idea:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1 4.5-3 6H8c-2-1.5-3-3.5-3-6a7 7 0 0 1 7-7z" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plant:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 22v-8M12 14c0-4 3-7 8-8-1 5-4 8-8 8zM12 14c0-4-3-7-8-8 1 5 4 8 8 8z" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  fire:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2c0 4-4 5-4 10a4 4 0 0 0 8 0c0-3-2-4-2-7 2 2 2 5 2 7a6 6 0 1 1-12 0c0-4 3-6 6-10z" fill={c} opacity=".9"/></svg>,
  trophy:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 5h12v7a6 6 0 0 1-12 0V5z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><path d="M12 18v3M8 21h8" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  clock:     (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.85"/><path d="M12 6v6l4 2" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  pet:       (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="4.5" cy="9.5" r="1.5" fill={c}/><circle cx="9" cy="5.5" r="1.5" fill={c}/><circle cx="15" cy="5.5" r="1.5" fill={c}/><circle cx="19.5" cy="9.5" r="1.5" fill={c}/><path d="M12 22c-4 0-8-2-8-7 0-2 1-3 2-4l1-2h10l1 2c1 1 2 2 2 4 0 5-4 7-8 7z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  food:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sun:       (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill={c} opacity=".8"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
};

export const TASK_ICON_LIST = Object.keys(TASK_ICONS);

export function TaskIconTile({ iconKey="default", color="#FF7A59", size=36 }) {
  const iconFn = TASK_ICONS[iconKey] || TASK_ICONS.default;
  const r = Math.round(size * 0.28);
  return (
    <div style={{
      width:size, height:size, borderRadius:r, flexShrink:0,
      background:`${color}22`, border:`1.5px solid ${color}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding: Math.round(size * 0.20),
    }}>
      <div style={{ width:"100%", height:"100%", color }}>
        {iconFn(color)}
      </div>
    </div>
  );
}

// Legacy export — kept so other pages don't break
export { HabitIconTile as PremiumHabitTile };
export function PremiumTaskMark({ size=32 }) {
  return <TaskIconTile iconKey="check" color="var(--accent)" size={size}/>;
}
export function CompleteTitle(props) { return <PremiumCompleteTitle {...props}/>; }