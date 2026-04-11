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
  water:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6 10 4 14 4 17a8 8 0 0 0 16 0c0-3-2-7-8-15z" fill={c} opacity=".9"/></svg>,
  run:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM5.5 18l3-5 3 2 2-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 12l-2-3-2 1-1-3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  book:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  gym:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5h1v11h-1zM16.5 6.5h1v11h-1zM6.5 11.5h11M2.5 9h4M17.5 9h4M2.5 15h4M17.5 15h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  sleep:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={c} opacity=".9"/></svg>,
  meditate: (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6" r="2" fill={c}/><path d="M6 20s1-5 6-5 6 5 6 5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M3 15c1.5-1 3-1 4 0M21 15c-1.5-1-3-1-4 0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  food:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  code:     (c) => <svg viewBox="0 0 24 24" fill="none"><polyline points="16 18 22 12 16 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 6 2 12 8 18" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  walk:     (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="1.5" fill={c}/><path d="M9 9l1 6-3 6M15 9l-1 6 3 6M9 9h6l1-4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  journal:  (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><line x1="8" y1="13" x2="16" y2="13" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="17" x2="12" y2="17" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  music:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="3" stroke={c} strokeWidth="1.8"/><circle cx="18" cy="16" r="3" stroke={c} strokeWidth="1.8"/></svg>,
  heart:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={c} opacity=".9"/></svg>,
  star:     (c) => <svg viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={c} opacity=".9"/></svg>,
  bike:     (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="18.5" cy="17.5" r="3.5" stroke={c} strokeWidth="1.8"/><circle cx="5.5" cy="17.5" r="3.5" stroke={c} strokeWidth="1.8"/><path d="M15 6h2l2 4M5.5 17.5L9 10h4l4 7.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plant:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 22v-8M12 14c0-4 3-7 8-8-1 5-4 8-8 8zM12 14c0-4-3-7-8-8 1 5 4 8 8 8z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  default:  (c) => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill={c} opacity=".85"/></svg>,
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
  default:  (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" fill={c} opacity=".85"/></svg>,
  check:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  repeat:   (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  star:     (c) => <svg viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={c} opacity=".9"/></svg>,
  work:     (c) => <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke={c} strokeWidth="1.85"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  home:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  shop:     (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke={c} strokeWidth="1.85"/></svg>,
  gym:      (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5h1v11h-1zM16.5 6.5h1v11h-1zM6.5 11.5h11M2.5 9h4M17.5 9h4M2.5 15h4M17.5 15h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  health:   (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  study:    (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  social:   (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth="1.85"/><circle cx="9" cy="7" r="4" stroke={c} strokeWidth="1.85"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
  travel:   (c) => <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92z" stroke={c} strokeWidth="1.85" strokeLinejoin="round"/></svg>,
  finance:  (c) => <svg viewBox="0 0 24 24" fill="none"><line x1="12" y1="1" x2="12" y2="23" stroke={c} strokeWidth="1.85" strokeLinecap="round"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={c} strokeWidth="1.85" strokeLinecap="round"/></svg>,
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