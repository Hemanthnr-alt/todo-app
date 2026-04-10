import { useId } from "react";

/**
 * Premium task “sticker” — layered glass tile with specular highlight, depth, and crisp check.
 */
export function PremiumTaskMark({ size = 32, accent }) {
  const uid = useId().replace(/:/g, "");
  const gid = `ptg-${uid}`;
  const hid = `phl-${uid}`;
  const fid = `psh-${uid}`;
  const useVar = !accent;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      style={{
        flexShrink: 0,
        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.18)) drop-shadow(0 0 20px var(--accent-glow))",
      }}
    >
      <defs>
        <linearGradient id={gid} x1="6" y1="4" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          {useVar ? (
            <>
              <stop stopColor="var(--accent-hover)" />
              <stop offset="0.35" stopColor="var(--accent)" />
              <stop offset="0.72" stopColor="var(--accent-pressed)" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity={0.92} />
            </>
          ) : (
            <>
              <stop stopColor={accent} stopOpacity={0.95} />
              <stop offset="0.5" stopColor={accent} />
              <stop offset="1" stopColor={accent} stopOpacity={0.78} />
            </>
          )}
        </linearGradient>
        <linearGradient id={hid} x1="16" y1="3" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.55)" />
          <stop offset="0.45" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={fid} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodColor="rgba(0,0,0,0.35)" />
        </filter>
        <linearGradient id={`${uid}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="rgba(255,255,255,0.55)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
        </linearGradient>
      </defs>

      {/* Outer rim (bevel) */}
      <rect x="1" y="2" width="30" height="28" rx="10" fill="rgba(0,0,0,0.12)" opacity={0.35} />

      {/* Main body */}
      <rect x="2" y="3" width="28" height="26" rx="9" fill={`url(#${gid})`} />

      {/* Top specular sheen */}
      <rect x="2" y="3" width="28" height="14" rx="9" fill={`url(#${hid})`} opacity={0.95} />

      {/* Inner inset border (glass edge) */}
      <rect x="3.5" y="4.5" width="25" height="23" rx="7.5" fill="none" stroke={`url(#${uid}-edge)`} strokeWidth="1" opacity={0.9} />

      {/* Check */}
      <path
        filter={`url(#${fid})`}
        d="M9.5 16.8l3.4 3.2L22.5 10.5"
        stroke="rgba(255,255,255,0.98)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Habit sticker — frosted gem tile with metallic rim; emoji sits in a lit well.
 */
export function PremiumHabitTile({ emoji, color, size = 32 }) {
  const s = size;
  const fontSize = Math.round(s * 0.5);
  const r = Math.max(11, Math.round(s * 0.36));
  return (
    <div
      aria-hidden
      style={{
        width: s,
        height: s,
        borderRadius: r,
        position: "relative",
        flexShrink: 0,
        background: `
          radial-gradient(ellipse 90% 60% at 50% 12%, rgba(255,255,255,0.5), transparent 52%),
          radial-gradient(ellipse 70% 45% at 50% 88%, rgba(0,0,0,0.15), transparent 55%),
          linear-gradient(168deg, ${color} 0%, ${color}e6 38%, ${color}bb 100%)`,
        border: "1px solid rgba(255,255,255,0.38)",
        boxShadow: `
          0 0 0 1px ${color}40,
          0 2px 0 rgba(255,255,255,0.35) inset,
          0 -3px 10px rgba(0,0,0,0.18) inset,
          0 10px 26px ${color}4d,
          0 4px 12px rgba(0,0,0,0.2)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          position: "relative",
          zIndex: 1,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))",
          textShadow: "0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        {emoji}
      </span>
    </div>
  );
}
