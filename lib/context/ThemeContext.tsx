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
const LS_GLASS_FROST = "tc_glass_frost";
const LS_GLASS_BLUR  = "tc_glass_blur";
const LS_GLASS_OPACITY = "tc_glass_opacity";
const LS_BG_INDEX = "tc_bg_index";
const LS_AUTO_BG = "tc_auto_bg";

const DEFAULT_KEY    = "violet";
const DEFAULT_DARK   = true;
const DEFAULT_CUSTOM = { primary: "#6366f1", secondary: "#ec4899", accent: "#f59e0b" };
const DEFAULT_GLASS_FROST = true;
const DEFAULT_GLASS_BLUR  = 36;
const DEFAULT_GLASS_OPACITY = 55;
const DEFAULT_BG_INDEX = 0;
const DEFAULT_AUTO_BG = true;

interface CustomTheme { primary: string; secondary: string; accent: string; }
interface ThemeContextValue {
  themeKey: string; setThemeKey: (k: string) => void;
  dark: boolean;    setDark: (fn: boolean | ((p: boolean) => boolean)) => void;
  glassFrost: boolean; setGlassFrost: (v: boolean) => void;
  glassBlur: number;   setGlassBlur: (v: number) => void;
  glassOpacity: number; setGlassOpacity: (v: number) => void;
  bgIndex: number; setBgIndex: (v: number | ((p: number) => number)) => void;
  autoBg: boolean; setAutoBg: (v: boolean) => void;
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
  const glassFrost = lsGet<boolean>(LS_GLASS_FROST, DEFAULT_GLASS_FROST);
  const glassBlur  = lsGet<number>(LS_GLASS_BLUR, DEFAULT_GLASS_BLUR);
  const glassOpacity = lsGet<number>(LS_GLASS_OPACITY, DEFAULT_GLASS_OPACITY);
  const bgIndex    = lsGet<number>(LS_BG_INDEX, DEFAULT_BG_INDEX);
  const autoBg     = lsGet<boolean>(LS_AUTO_BG, DEFAULT_AUTO_BG);
  const custom: CustomTheme = {
    primary:   HEX.test(raw.primary)   ? raw.primary   : DEFAULT_CUSTOM.primary,
    secondary: HEX.test(raw.secondary) ? raw.secondary : DEFAULT_CUSTOM.secondary,
    accent:    HEX.test(raw.accent)    ? raw.accent    : DEFAULT_CUSTOM.accent,
  };
  return { key, dark, custom, glassFrost, glassBlur, glassOpacity, bgIndex, autoBg };
}

function buildAllThemes(custom: CustomTheme): Record<string, ThemeColors> {
  return {
    ...THEMES,
    custom: { ...custom, name: "Custom", swatch: [custom.primary, custom.secondary, custom.accent] },
  };
}

function applyToDom(theme: ThemeColors, dark: boolean, glassFrost: boolean, blur: number, opacity: number): void {
  const r = document.documentElement;
  r.style.setProperty("--tc-primary",   theme.primary);
  r.style.setProperty("--tc-secondary", theme.secondary);
  r.style.setProperty("--tc-accent",    theme.accent);
  r.style.setProperty("--glass-blur",   glassFrost ? `${blur}px` : "0px");
  r.style.setProperty("--glass-opacity", `${opacity}%`);
  // Values for .admin-panel usage
  r.style.setProperty("--glass-blur-val", glassFrost ? `${blur}px` : "0px");
  r.style.setProperty("--glass-opacity-val", glassFrost ? `${opacity}%` : "100%");
  r.classList.toggle("tc-dark",  dark);
  r.classList.toggle("tc-light", !dark);
  r.setAttribute("data-theme", dark ? "dark" : "light");
  document.body.style.setProperty("background", dark ? "#07070f" : "#f4f3ff", "important");
  document.body.style.setProperty("color",      dark ? "#f0eeff" : "#0f0a2e", "important");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // KEY FIX: Init state with defaults so Server & Client HTML match exactly (fixes hydration errors).
  // Then sync from localStorage in useLayoutEffect (before paint) so the user never sees a flash.
  const [themeKey,    setKey]     = useState<string>(DEFAULT_KEY);
  const [dark,        setDarkRaw] = useState<boolean>(DEFAULT_DARK);
  const [customTheme, setCustRaw] = useState<CustomTheme>(DEFAULT_CUSTOM);
  const [glassFrost,  setGlassFrost] = useState<boolean>(DEFAULT_GLASS_FROST);
  const [glassBlur,   setGlassBlur]  = useState<number>(DEFAULT_GLASS_BLUR);
  const [glassOpacity, setGlassOpacity] = useState<number>(DEFAULT_GLASS_OPACITY);
  const [bgIndex,     setBgIndexRaw] = useState<number>(DEFAULT_BG_INDEX);
  const [autoBg,      setAutoBg]     = useState<boolean>(DEFAULT_AUTO_BG);

  useLayoutEffect(() => {
    const data = readFromStorage();
    if (data) {
      setKey(data.key); setDarkRaw(data.dark); setCustRaw(data.custom);
      setGlassFrost(data.glassFrost); setGlassBlur(data.glassBlur); setGlassOpacity(data.glassOpacity);
      setBgIndexRaw(data.bgIndex); setAutoBg(data.autoBg);
    }
  }, []);

  const allThemes = buildAllThemes(customTheme);
  const theme = allThemes[themeKey] ?? THEMES.violet;

  // Apply to DOM on every relevant state change
  useLayoutEffect(() => { applyToDom(theme, dark, glassFrost, glassBlur, glassOpacity); }, [theme, dark, glassFrost, glassBlur, glassOpacity]);

  // Persist to localStorage on change
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  useEffect(() => { if (mounted.current) lsSet(LS_THEME, themeKey); }, [themeKey]);
  useEffect(() => { if (mounted.current) lsSet(LS_DARK, dark); }, [dark]);
  useEffect(() => { if (mounted.current) lsSet(LS_CUSTOM, customTheme); }, [customTheme]);
  useEffect(() => { if (mounted.current) lsSet(LS_GLASS_FROST, glassFrost); }, [glassFrost]);
  useEffect(() => { if (mounted.current) lsSet(LS_GLASS_BLUR, glassBlur); }, [glassBlur]);
  useEffect(() => { if (mounted.current) lsSet(LS_GLASS_OPACITY, glassOpacity); }, [glassOpacity]);
  useEffect(() => { if (mounted.current) lsSet(LS_BG_INDEX, bgIndex); }, [bgIndex]);
  useEffect(() => { if (mounted.current) lsSet(LS_AUTO_BG, autoBg); }, [autoBg]);

  const setThemeKey    = (k: string) => setKey(k);
  const setDark        = (fn: boolean | ((p: boolean) => boolean)) => setDarkRaw(p => typeof fn === "function" ? fn(p) : fn);
  const setCustomTheme = (p: Partial<CustomTheme>) => setCustRaw(prev => ({ ...prev, ...p }));
  const setBgIndex     = (p: number | ((p: number) => number)) => setBgIndexRaw(p);

  return (
    <Ctx.Provider value={{
      themeKey, setThemeKey,
      dark, setDark,
      glassFrost, setGlassFrost,
      glassBlur, setGlassBlur,
      glassOpacity, setGlassOpacity,
      bgIndex, setBgIndex,
      autoBg, setAutoBg,
      theme, THEMES: allThemes,
      customTheme, setCustomTheme
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
