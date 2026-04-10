/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const DEFAULT_ACCENT = "#FF7A59";
const LEGACY_DEFAULTS = new Set(["#6B46FF", "#7C5CFC", "#a855f7", "#ff6b9d"]);

export const ACCENT_PRESETS = [
  { name: "Sunset", value: "#FF7A59" },
  { name: "Sky", value: "#49B9FF" },
  { name: "Mint", value: "#59D68D" },
  { name: "Gold", value: "#FFB547" },
  { name: "Berry", value: "#FF6F7D" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Ocean", value: "#0EA5E9" },
  { name: "Rose", value: "#E11D48" },
];

const hexToRgb = (hex) => {
  const value = hex.replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((char) => char + char).join("")
    : value;
  const int = Number.parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const rgbToHex = ({ r, g, b }) => `#${[r, g, b]
  .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
  .join("")}`;

const mixHex = (hex, target, amount) => {
  const source = hexToRgb(hex);
  const dest = hexToRgb(target);
  return rgbToHex({
    r: source.r + (dest.r - source.r) * amount,
    g: source.g + (dest.g - source.g) * amount,
    b: source.b + (dest.b - source.b) * amount,
  });
};

const withAlpha = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const normalizeAccent = (accent) => (LEGACY_DEFAULTS.has(accent) ? DEFAULT_ACCENT : accent);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [accent, setAccent] = useState(() => normalizeAccent(localStorage.getItem("accent") || DEFAULT_ACCENT));

  useEffect(() => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("accent", accent);

    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-hover", mixHex(accent, "#ffffff", 0.16));
    root.style.setProperty("--accent-pressed", mixHex(accent, "#000000", 0.12));
    root.style.setProperty("--accent-glow", withAlpha(accent, 0.35));
    root.style.setProperty("--accent-subtle", withAlpha(accent, 0.16));
    root.style.setProperty("--accent-soft", withAlpha(accent, 0.08));

    document.body.style.background = "";
    document.body.style.backgroundImage = "";
    document.body.style.backgroundColor = "";
    document.body.style.backgroundAttachment = "";
    document.body.style.color = "";
  }, [theme, accent]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  const changeAccent = (color) => setAccent(color);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: theme === "dark",
        accent,
        changeAccent,
        setAccent: changeAccent,
        ACCENT_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
