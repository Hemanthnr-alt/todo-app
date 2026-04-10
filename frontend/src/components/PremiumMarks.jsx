import { useId } from "react";

/** Premium-style task glyph (gradient tile + check). Uses theme accent via CSS variables, or optional hex override. */
export function PremiumTaskMark({ size = 32, accent }) {
  const uid = useId().replace(/:/g, "");
  const gid = `pt-${uid}`;
  const useVar = !accent;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={gid} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          {useVar ? (
            <>
              <stop stopColor="var(--accent)" />
              <stop offset="0.5" stopColor="var(--accent-hover)" />
              <stop offset="1" stopColor="var(--accent-pressed)" />
            </>
          ) : (
            <>
              <stop stopColor={accent} />
              <stop offset="1" stopColor={accent} stopOpacity={0.75} />
            </>
          )}
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="28" height="26" rx="9" fill={`url(#${gid})`} />
      <rect x="2" y="3" width="28" height="26" rx="9" fill="rgba(255,255,255,0.12)" />
      <path
        d="M10 16.5l3.2 3.2L22 11"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Habit emoji on a glossy gradient tile (uses habit color + icon). */
export function PremiumHabitTile({ emoji, color, size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `linear-gradient(155deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.52),
        lineHeight: 1,
        boxShadow: `0 6px 18px ${color}45, inset 0 1px 0 rgba(255,255,255,0.35)`,
        border: "1px solid rgba(255,255,255,0.25)",
        flexShrink: 0,
      }}
      aria-hidden
    >
      {emoji}
    </div>
  );
}
