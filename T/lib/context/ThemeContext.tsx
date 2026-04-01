"use client";

import React, { createContext, useContext, useState, useLayoutEffect, useEffect, useRef } from "react";

export interface ThemeColors {
  primary: string; secondary: string; accent: string;
  name: string; swatch: [string, string, string];
}

export const THEMES: Record<string, ThemeColors> = {
  violet:   { primary: "#6366f1", secondary: "#8b5cf6", accent: "#06b6d4", name: "Violet",   swatch: ["#6366f1","#8b5cf6","#06b6d4"] },
  emerald:  { primary: "#10b981", secondary: "#059669", accent: "#34d399", name: "Emerald",  swatch: ["#10b981","#059669","#34d399"] },
  rose:     { primary: "#f43f5e", secondary: "#e11d48", accent: "#fb7185", name: "Rose",     swatch: ["#f43f5e","#e11d48","#fb7185"] },
  amber:    { primary: "#f59e0b", secondary: "#d97706", accent: "#fbbf24", name: "Amber",    swatch: ["#f59e0b","#d97706","#fbbf24"] },
  cyan:     { primary: "#06b6d4", secondary: "#0891b2", accent: "#67e8f9", name: "Cyan",     swatch: ["#06b6d4","#0891b2","#67e8f9"] },
  aurora:   { primary: "#a855f7", secondary: "#06b6d4", accent: "#34d399", name: "Aurora",   swatch: ["#a855f7","#06b6d4","#34d399"] },
  sunset:   { primary: "#f97316", secondary: "#ec4899", accent: "#fbbf24", name: "Sunset",   swatch: ["#f97316","#ec4899","#fbbf24"] },
  ocean:    { primary: "#3b82f6", secondary: "#06b6d4", accent: "#a855f7", name: "Ocean",    swatch: ["#3b82f6","#06b6d4","#a855f7"] },
  neon:     { primary: "#22c55e", secondary: "#a855f7", accent: "#06b6d4", name: "Neon",     swatch: ["#22c55e","#a855f7","#06b6d4"] },
  fire:     { primary: "#ef4444", secondary: "#f97316", accent: "#f59e0b", name: "Fire",     swatch: ["#ef4444","#f97316","#f59e0b"] },
  galaxy:   { primary: "#7c3aed", secondary: "#2563eb", accent: "#ec4899", name: "Galaxy",   swatch: ["#7c3aed","#2563eb","#ec4899"] },
  tropical: { primary: "#10b981", secondary: "#f59e0b", accent: "#06b6d4", name: "Tropical", swatch: ["#10b981","#f59e0b","#06b6d4"] },
  candy:    { primary: "#ec4899", secondary: "#a855f7", accent: "#6366f1", name: "Candy",    swatch: ["#ec4899","#a855f7","#6366f1"] },
  arctic:   { primary: "#67e8f9", secondary: "#818cf8", accent: "#a78bfa", name: "Arctic",   swatch: ["#67e8f9","#818cf8","#a78bfa"] },
  infrared: { primary: "#ef4444", secondary: "#7c3aed", accent: "#06b6d4", name: "Infrared", swatch: ["#ef4444","#7c3aed","#06b6d4"] },
};

const LS_THEME  = "tc_theme_key";
const LS_DARK   = "tc_dark";
const LS_CUSTOM = "tc_custom";

const DEFAULT_KEY    = "violet";
const DEFAULT_DARK   = true;
const DEFAULT_CUSTOM = { primary: "#6366f1", secondary: "#ec4899", accent: "#f59e0b" };

interface CustomTheme { primary: string; secondary: string; accent: string; }
interface ThemeContextValue {
  themeKey: string; setThemeKey: (k: string) => void;
  dark: boolean;    setDark: (fn: boolean | ((p: boolean) => boolean)) => void;
  theme: ThemeColors;
  THEMES: Record<string, ThemeColors>;
  customTheme: CustomTheme; setCustomTheme: (p: Partial<CustomTheme>) => void;
}

const Ctx = createContext<ThemeContextValue | null>(null);

function lsGet<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r !== null ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// Read synchronously from localStorage — safe because this only runs on client
function readFromStorage() {
  if (typeof window === "undefined") return null;
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const key    = lsGet<string>(LS_THEME, DEFAULT_KEY);
  const dark   = lsGet<boolean>(LS_DARK, DEFAULT_DARK);
  const raw    = lsGet<CustomTheme>(LS_CUSTOM, DEFAULT_CUSTOM);
  const custom: CustomTheme = {
    primary:   HEX.test(raw.primary)   ? raw.primary   : DEFAULT_CUSTOM.primary,
    secondary: HEX.test(raw.secondary) ? raw.secondary : DEFAULT_CUSTOM.secondary,
    accent:    HEX.test(raw.accent)    ? raw.accent    : DEFAULT_CUSTOM.accent,
  };
  return { key, dark, custom };
}

function buildAllThemes(custom: CustomTheme): Record<string, ThemeColors> {
  return {
    ...THEMES,
    custom: { ...custom, name: "Custom", swatch: [custom.primary, custom.secondary, custom.accent] },
  };
}

function applyToDom(theme: ThemeColors, dark: boolean): void {
  const r = document.documentElement;
  r.style.setProperty("--tc-primary",   theme.primary);
  r.style.setProperty("--tc-secondary", theme.secondary);
  r.style.setProperty("--tc-accent",    theme.accent);
  r.classList.toggle("tc-dark",  dark);
  r.classList.toggle("tc-light", !dark);
  r.setAttribute("data-theme", dark ? "dark" : "light");
  document.body.style.setProperty("background", dark ? "#07070f" : "#f4f3ff", "important");
  document.body.style.setProperty("color",      dark ? "#f0eeff" : "#0f0a2e", "important");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // KEY FIX: Read localStorage synchronously inside useState initializer.
  // On SSR (server): returns null → falls back to defaults (no window).
  // On client (first render): reads actual stored value immediately.
  // Combined with suppressHydrationWarning, this eliminates the flash entirely.
  const [themeKey,    setKey]     = useState<string>(() => readFromStorage()?.key ?? DEFAULT_KEY);
  const [dark,        setDarkRaw] = useState<boolean>(() => readFromStorage()?.dark ?? DEFAULT_DARK);
  const [customTheme, setCustRaw] = useState<CustomTheme>(() => readFromStorage()?.custom ?? DEFAULT_CUSTOM);

  const allThemes = buildAllThemes(customTheme);
  const theme = allThemes[themeKey] ?? THEMES.violet;

  // Apply to DOM on every relevant state change (useLayoutEffect = before paint)
  useLayoutEffect(() => { applyToDom(theme, dark); }, [theme, dark]);

  // Persist to localStorage on change
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  useEffect(() => { if (mounted.current) lsSet(LS_THEME, themeKey); }, [themeKey]);
  useEffect(() => { if (mounted.current) lsSet(LS_DARK, dark); }, [dark]);
  useEffect(() => { if (mounted.current) lsSet(LS_CUSTOM, customTheme); }, [customTheme]);

  const setThemeKey    = (k: string) => setKey(k);
  const setDark        = (fn: boolean | ((p: boolean) => boolean)) => setDarkRaw(p => typeof fn === "function" ? fn(p) : fn);
  const setCustomTheme = (p: Partial<CustomTheme>) => setCustRaw(prev => ({ ...prev, ...p }));

  return (
    <Ctx.Provider value={{ themeKey, setThemeKey, dark, setDark, theme, THEMES: allThemes, customTheme, setCustomTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
