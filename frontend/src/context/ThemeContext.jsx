/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const DEFAULT_ACCENT = "#FF7A59";
const LEGACY_DEFAULTS = new Set(["#6B46FF","#7C5CFC","#a855f7","#ff6b9d"]);

export const ACCENT_PRESETS = [
  { name:"Sunset",  value:"#FF7A59" },
  { name:"Coral",   value:"#FF5A5F" },
  { name:"Amber",   value:"#F5A623" },
  { name:"Lime",    value:"#69D025" },
  { name:"Sky",     value:"#49B9FF" },
  { name:"Mint",    value:"#3DD68C" },
  { name:"Violet",  value:"#8B5CF6" },
  { name:"Pink",    value:"#EC4899" },
  { name:"Teal",    value:"#14B8A6" },
  { name:"Indigo",  value:"#6366F1" },
  { name:"Rose",    value:"#F43F5E" },
  { name:"Gold",    value:"#EAB308" },
];

const STREAK_UNLOCKS = [
  { streak: 3, value: "#FF5A5F" },
  { streak: 7, value: "#8B5CF6" },
  { streak: 30, value: "#EAB308" },
];

const hexToRgb = (hex) => {
  const v = hex.replace("#","");
  const n = v.length===3 ? v.split("").map(c=>c+c).join("") : v;
  const i = parseInt(n,16);
  return { r:(i>>16)&255, g:(i>>8)&255, b:i&255 };
};
const clamp = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
const rgbToHex = ({r,g,b}) => `#${[r,g,b].map(c=>clamp(Math.round(c),0,255).toString(16).padStart(2,"0")).join("")}`;
const mixHex = (hex,tgt,amt) => {
  const s=hexToRgb(hex), d=hexToRgb(tgt);
  return rgbToHex({r:s.r+(d.r-s.r)*amt,g:s.g+(d.g-s.g)*amt,b:s.b+(d.b-s.b)*amt});
};
const withAlpha = (hex,a) => { const {r,g,b}=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const normalizeAccent = (a) => (LEGACY_DEFAULTS.has(a)?DEFAULT_ACCENT:a);

export const unlockAccentForStreak = (streak = 0) => {
  if (typeof window === "undefined") return [];

  const unlocked = STREAK_UNLOCKS
    .filter(({ streak: minStreak }) => streak >= minStreak)
    .map(({ value }) => value);

  localStorage.setItem("unlockedAccents", JSON.stringify(unlocked));
  return unlocked;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

// Valid themes: "dark" | "ultra" | "light"
export const ThemeProvider = ({ children }) => {
  const [theme,  setTheme]  = useState(() => {
    const t = localStorage.getItem("theme");
    return ["dark","ultra","light"].includes(t) ? t : "dark";
  });
  const [accent, setAccent] = useState(() => normalizeAccent(localStorage.getItem("accent")||DEFAULT_ACCENT));
  const [buttonShape, setButtonShape] = useState(() => localStorage.getItem("buttonShape") || "rounded");

  useEffect(() => {
    localStorage.setItem("theme",  theme);
    localStorage.setItem("accent", accent);

    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.setProperty("--accent",         accent);
    root.style.setProperty("--accent-hover",   mixHex(accent,"#ffffff",0.14));
    root.style.setProperty("--accent-pressed", mixHex(accent,"#000000",0.14));
    root.style.setProperty("--accent-glow",    withAlpha(accent,0.30));
    root.style.setProperty("--accent-subtle",  withAlpha(accent,0.15));
    root.style.setProperty("--accent-soft",    withAlpha(accent,0.08));
    root.style.setProperty("--radius-btn",     buttonShape === "pill" ? "999px" : "14px");
  }, [theme, accent, buttonShape]);

  const toggleTheme  = () => setTheme(p => p==="dark"?"light":p==="light"?"ultra":"dark");
  const setThemeTo   = (t) => setTheme(t);
  const changeAccent = (c) => setAccent(c);
  const changeShape  = (s) => { setButtonShape(s); localStorage.setItem("buttonShape", s); };

  return (
    <ThemeContext.Provider value={{
      theme, setTheme: setThemeTo, toggleTheme,
      isDark: theme!=="light",
      isUltraDark: theme==="ultra",
      accent, changeAccent, setAccent: changeAccent,
      buttonShape, changeShape,
      ACCENT_PRESETS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
