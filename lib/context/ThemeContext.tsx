"use client";

import React, {
  createContext,
  useContext,
  useState,
  useLayoutEffect,
  useEffect,
  useRef,
} from "react";
import { usePathname } from "next/navigation";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  name: string;
  swatch: [string, string, string];
}

/* ── Theme catalog — warm tones first, then cool tones ─────────────────────── */
export const THEMES: Record<string, ThemeColors> = {
  // ── Warm Palette ──
  orange:   { primary: "#e0550b", secondary: "#b63b07", accent: "#cc350f", name: "Orange",   swatch: ["#e0550b","#b63b07","#cc350f"] },
  amber:    { primary: "#f59e0b", secondary: "#d97706", accent: "#fbbf24", name: "Amber",    swatch: ["#f59e0b","#d97706","#fbbf24"] },
  sunset:   { primary: "#f97316", secondary: "#ec4899", accent: "#fbbf24", name: "Sunset",   swatch: ["#f97316","#ec4899","#fbbf24"] },
  rose:     { primary: "#f43f5e", secondary: "#e11d48", accent: "#fb7185", name: "Rose",     swatch: ["#f43f5e","#e11d48","#fb7185"] },
  fire:     { primary: "#ef4444", secondary: "#f97316", accent: "#f59e0b", name: "Fire",     swatch: ["#ef4444","#f97316","#f59e0b"] },
  tropical: { primary: "#10b981", secondary: "#f59e0b", accent: "#06b6d4", name: "Tropical", swatch: ["#10b981","#f59e0b","#06b6d4"] },
  candy:    { primary: "#ec4899", secondary: "#a855f7", accent: "#6366f1", name: "Candy",    swatch: ["#ec4899","#a855f7","#6366f1"] },
  // ── Cool Palette ──
  violet:   { primary: "#6366f1", secondary: "#8b5cf6", accent: "#06b6d4", name: "Violet",   swatch: ["#6366f1","#8b5cf6","#06b6d4"] },
  emerald:  { primary: "#10b981", secondary: "#059669", accent: "#34d399", name: "Emerald",  swatch: ["#10b981","#059669","#34d399"] },
  cyan:     { primary: "#06b6d4", secondary: "#0891b2", accent: "#67e8f9", name: "Cyan",     swatch: ["#06b6d4","#0891b2","#67e8f9"] },
  ocean:    { primary: "#3b82f6", secondary: "#06b6d4", accent: "#a855f7", name: "Ocean",    swatch: ["#3b82f6","#06b6d4","#a855f7"] },
  arctic:   { primary: "#67e8f9", secondary: "#818cf8", accent: "#a78bfa", name: "Arctic",   swatch: ["#67e8f9","#818cf8","#a78bfa"] },
  galaxy:   { primary: "#7c3aed", secondary: "#2563eb", accent: "#ec4899", name: "Galaxy",   swatch: ["#7c3aed","#2563eb","#ec4899"] },
  neon:     { primary: "#22c55e", secondary: "#a855f7", accent: "#06b6d4", name: "Neon",     swatch: ["#22c55e","#a855f7","#06b6d4"] },
  aurora:   { primary: "#a855f7", secondary: "#06b6d4", accent: "#34d399", name: "Aurora",   swatch: ["#a855f7","#06b6d4","#34d399"] },
  infrared: { primary: "#ef4444", secondary: "#7c3aed", accent: "#06b6d4", name: "Infrared", swatch: ["#ef4444","#7c3aed","#06b6d4"] },
};

/* ── Storage key bases ─────────────────────────────────────────────────────── */
const SS_THEME        = "tc_theme_key";
const SS_DARK         = "tc_dark";
const SS_CUSTOM       = "tc_custom";
const SS_GLASS_FROST  = "tc_glass_frost";
const SS_GLASS_BLUR   = "tc_glass_blur";
const SS_GLASS_OPACITY = "tc_glass_opacity";
const SS_BG_INDEX     = "tc_bg_index";
const SS_AUTO_BG      = "tc_auto_bg";

const DEFAULT_KEY          = "orange";
const DEFAULT_DARK         = true;
const DEFAULT_CUSTOM       = { primary: "#e0550b", secondary: "#b63b07", accent: "#cc350f" };
const DEFAULT_GLASS_FROST  = true;
const DEFAULT_GLASS_BLUR   = 36;
const DEFAULT_GLASS_OPACITY = 55;
const DEFAULT_BG_INDEX     = 0;
const DEFAULT_AUTO_BG      = true;

/* ── Route helpers ─────────────────────────────────────────────────────────── */
const PUBLIC_ROUTES = new Set([
  "/login", "/register", "/forgot-password", "/reset-password", "/super/login",
]);
const SUPER_ADMIN_PREFIXES = ["/super"];

function isPublicRoute(path: string) {
  return PUBLIC_ROUTES.has(path);
}
function isSuperAdminRoute(path: string) {
  return SUPER_ADMIN_PREFIXES.some((p) => path.startsWith(p));
}

/* ── sessionStorage helpers (SSR-safe — never crashes on server) ───────────── */
function buildKey(base: string, userId?: string | null, isSuperAdmin?: boolean): string {
  if (!userId) return base;
  return isSuperAdmin ? `${base}_${userId}_superadmin` : `${base}_${userId}`;
}

function ssGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const r = sessionStorage.getItem(key);
    return r !== null ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

function ssSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota */ }
}

/* ── Context types ─────────────────────────────────────────────────────────── */
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

/* ── Read synchronously from sessionStorage ─────────────────────────────────
 * Keys are namespaced by userId (and _superadmin suffix for super admin routes)
 * so different users / roles in different tabs are fully isolated.
 * ──────────────────────────────────────────────────────────────────────────── */
function readFromStorage(userId?: string | null, isSuperAdmin?: boolean) {
  if (typeof window === "undefined") return null;
  const HEX = /^#[0-9a-fA-F]{6}$/;

  const key          = ssGet<string>(buildKey(SS_THEME, userId, isSuperAdmin), DEFAULT_KEY);
  const dark         = ssGet<boolean>(buildKey(SS_DARK, userId, isSuperAdmin), DEFAULT_DARK);
  const raw          = ssGet<CustomTheme>(buildKey(SS_CUSTOM, userId, isSuperAdmin), DEFAULT_CUSTOM);
  const glassFrost   = ssGet<boolean>(buildKey(SS_GLASS_FROST, userId, isSuperAdmin), DEFAULT_GLASS_FROST);
  const glassBlur    = ssGet<number>(buildKey(SS_GLASS_BLUR, userId, isSuperAdmin), DEFAULT_GLASS_BLUR);
  const glassOpacity = ssGet<number>(buildKey(SS_GLASS_OPACITY, userId, isSuperAdmin), DEFAULT_GLASS_OPACITY);
  const bgIndex      = ssGet<number>(buildKey(SS_BG_INDEX, userId, isSuperAdmin), DEFAULT_BG_INDEX);
  const autoBg       = ssGet<boolean>(buildKey(SS_AUTO_BG, userId, isSuperAdmin), DEFAULT_AUTO_BG);

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
    custom: {
      ...custom,
      name: "Custom",
      swatch: [custom.primary, custom.secondary, custom.accent],
    },
  };
}

function applyToDom(
  theme: ThemeColors,
  dark: boolean,
  glassFrost: boolean,
  blur: number,
  opacity: number
): void {
  const r = document.documentElement;
  r.style.setProperty("--tc-primary",   theme.primary);
  r.style.setProperty("--tc-secondary", theme.secondary);
  r.style.setProperty("--tc-accent",    theme.accent);
  r.style.setProperty("--glass-blur",   glassFrost ? `${blur}px` : "0px");
  r.style.setProperty("--glass-opacity", `${opacity}%`);
  // Values for .admin-panel usage
  r.style.setProperty("--glass-blur-val", glassFrost ? `${blur}px` : "0px");
  r.style.setProperty("--glass-opacity-val", glassFrost ? `${opacity}%` : "100%");

  // Spatial glass vars consumed by .admin-panel CSS class
  const opVal = glassFrost ? (opacity / 100) : 1;
  if (dark) {
    r.style.setProperty("--spatial-glass-bg",     glassFrost ? `rgba(30,30,35,${(0.4 * opVal).toFixed(2)})` : "rgba(30,30,35,0.95)");
    r.style.setProperty("--spatial-glass-blur",   glassFrost ? `blur(${blur}px) saturate(200%) brightness(1.06)` : "none");
    r.style.setProperty("--spatial-glass-border", glassFrost ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.08)");
    r.style.setProperty("--spatial-glass-shadow", glassFrost
      ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 40px rgba(0,0,0,0.35)"
      : "0 4px 16px rgba(0,0,0,0.25)");
  } else {
    r.style.setProperty("--spatial-glass-bg",     glassFrost ? `rgba(255,255,255,${(0.20 * opVal).toFixed(2)})` : "rgba(255,255,255,0.92)");
    r.style.setProperty("--spatial-glass-blur",   glassFrost ? `blur(${blur}px) saturate(220%)` : "none");
    r.style.setProperty("--spatial-glass-border", glassFrost ? "1px solid rgba(255,255,255,0.85)" : "1px solid rgba(0,0,0,0.08)");
    r.style.setProperty("--spatial-glass-shadow", glassFrost
      ? "inset 0 1px 0 rgba(255,255,255,0.85), 0 4px 16px -2px rgba(0,0,0,0.06)"
      : "0 2px 8px rgba(0,0,0,0.06)");
  }
  r.style.setProperty("--spatial-glass-radius", "16px");

  /* ── Dynamic orb edge colours — follow the active theme ── */
  r.style.setProperty("--orb-edge-1", theme.primary);
  r.style.setProperty("--orb-edge-2", theme.secondary);
  r.style.setProperty("--orb-edge-3", theme.accent);

  r.classList.toggle("tc-dark",  dark);
  r.classList.toggle("tc-light", !dark);
  r.setAttribute("data-theme", dark ? "dark" : "light");
  document.body.style.setProperty("background", dark ? "#07070f" : "#f4f3ff", "important");
  document.body.style.setProperty("color",      dark ? "#f0eeff" : "#0f0a2e", "important");
}

/* ══════════════════════════════════════════════════════════════════════════════
 * ThemeProvider
 *
 * Accepts optional userId + userRole from server-side layouts.
 *
 * Behaviour:
 *   • Public routes (/, /login, …)       → always orange, theme changes blocked
 *   • Super admin routes (/super/…)      → default RED, user's pick in session
 *   • Admin / Employee routes            → default ORANGE, user's pick in session
 *
 * Storage:
 *   • sessionStorage only → closes with the tab, tabs are fully isolated
 *   • Keys namespaced: tc_theme_key_{userId} or tc_theme_key_{userId}_superadmin
 * ══════════════════════════════════════════════════════════════════════════════ */
export function ThemeProvider({
  children,
  userId,
  userRole,
}: {
  children: React.ReactNode;
  userId?: string | null;
  userRole?: string | null;
}) {
  const pathname = usePathname() ?? "/";
  const isPublic     = isPublicRoute(pathname);
  const isSuperAdmin = isSuperAdminRoute(pathname) && userRole === "super_admin";

  // Determine the role-based default theme key
  const roleDefault = isSuperAdmin ? "ocean" : DEFAULT_KEY; // "ocean" = blue tones for super admin

  // Init state with defaults so Server & Client HTML match (prevents hydration errors).
  // Then sync from sessionStorage in useLayoutEffect (before paint).
  const [themeKey,     setKey]       = useState<string>(DEFAULT_KEY);
  const [dark,         setDarkRaw]   = useState<boolean>(DEFAULT_DARK);
  const [customTheme,  setCustRaw]   = useState<CustomTheme>(DEFAULT_CUSTOM);
  const [glassFrost,   setGlassFrost]  = useState<boolean>(DEFAULT_GLASS_FROST);
  const [glassBlur,    setGlassBlur]   = useState<number>(DEFAULT_GLASS_BLUR);
  const [glassOpacity, setGlassOpacity] = useState<number>(DEFAULT_GLASS_OPACITY);
  const [bgIndex,      setBgIndexRaw] = useState<number>(DEFAULT_BG_INDEX);
  const [autoBg,       setAutoBg]     = useState<boolean>(DEFAULT_AUTO_BG);

  // Sync from sessionStorage before first paint
  useLayoutEffect(() => {
    // Public routes → force orange, ignore all stored preferences
    if (isPublic) {
      setKey("orange");
      return;
    }

    const data = readFromStorage(userId, isSuperAdmin);
    if (data) {
      // If nothing was stored yet, use the role-based default
      const resolvedKey = data.key === DEFAULT_KEY && !ssGet<string>(
        buildKey(SS_THEME, userId, isSuperAdmin),
        ""
      ) ? roleDefault : data.key;

      setKey(resolvedKey);
      setDarkRaw(data.dark);
      setCustRaw(data.custom);
      setGlassFrost(data.glassFrost);
      setGlassBlur(data.glassBlur);
      setGlassOpacity(data.glassOpacity);
      setBgIndexRaw(data.bgIndex);
      setAutoBg(data.autoBg);
    } else {
      setKey(roleDefault);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userId, userRole]);

  const allThemes = buildAllThemes(customTheme);
  const theme = allThemes[themeKey] ?? THEMES.orange;

  // Apply to DOM on every relevant state change
  useLayoutEffect(() => {
    applyToDom(theme, dark, glassFrost, glassBlur, glassOpacity);
  }, [theme, dark, glassFrost, glassBlur, glassOpacity]);

  // ── Persist to sessionStorage on change (namespaced by userId) ──
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);

  useEffect(() => {
    if (!mounted.current || isPublic || !userId) return;
    ssSet(buildKey(SS_THEME, userId, isSuperAdmin), themeKey);
    // Also write a generic "last applied" key for the blocking script
    ssSet(SS_THEME, themeKey);
  }, [themeKey, userId, isSuperAdmin, isPublic]);

  useEffect(() => {
    if (!mounted.current || isPublic || !userId) return;
    ssSet(buildKey(SS_DARK, userId, isSuperAdmin), dark);
    ssSet(SS_DARK, dark);
  }, [dark, userId, isSuperAdmin, isPublic]);

  useEffect(() => {
    if (!mounted.current || isPublic || !userId) return;
    ssSet(buildKey(SS_CUSTOM, userId, isSuperAdmin), customTheme);
  }, [customTheme, userId, isSuperAdmin, isPublic]);

  useEffect(() => {
    if (!mounted.current || isPublic || !userId) return;
    ssSet(buildKey(SS_GLASS_FROST, userId, isSuperAdmin), glassFrost);
  }, [glassFrost, userId, isSuperAdmin, isPublic]);

  useEffect(() => {
    if (!mounted.current || isPublic || !userId) return;
    ssSet(buildKey(SS_GLASS_BLUR, userId, isSuperAdmin), glassBlur);
  }, [glassBlur, userId, isSuperAdmin, isPublic]);

  useEffect(() => {
    if (!mounted.current || isPublic || !userId) return;
    ssSet(buildKey(SS_GLASS_OPACITY, userId, isSuperAdmin), glassOpacity);
  }, [glassOpacity, userId, isSuperAdmin, isPublic]);

  useEffect(() => {
    if (!mounted.current || isPublic || !userId) return;
    ssSet(buildKey(SS_BG_INDEX, userId, isSuperAdmin), bgIndex);
  }, [bgIndex, userId, isSuperAdmin, isPublic]);

  useEffect(() => {
    if (!mounted.current || isPublic || !userId) return;
    ssSet(buildKey(SS_AUTO_BG, userId, isSuperAdmin), autoBg);
  }, [autoBg, userId, isSuperAdmin, isPublic]);

  // ── Public API — block changes on public routes ─────────────────────────
  const setThemeKey = (k: string) => {
    if (isPublic) return; // Never let theme-picker change public pages
    setKey(k);
  };
  const setDark = (fn: boolean | ((p: boolean) => boolean)) => {
    setDarkRaw(p => typeof fn === "function" ? fn(p) : fn);
  };
  const setCustomTheme = (p: Partial<CustomTheme>) => {
    if (isPublic) return;
    setCustRaw(prev => ({ ...prev, ...p }));
  };
  const setBgIndex = (p: number | ((p: number) => number)) => {
    if (isPublic) return;
    setBgIndexRaw(p);
  };

  return (
    <Ctx.Provider value={{
      themeKey, setThemeKey,
      dark, setDark,
      glassFrost: isPublic ? DEFAULT_GLASS_FROST : glassFrost,
      setGlassFrost: isPublic ? () => {} : setGlassFrost,
      glassBlur: isPublic ? DEFAULT_GLASS_BLUR : glassBlur,
      setGlassBlur: isPublic ? () => {} : setGlassBlur,
      glassOpacity: isPublic ? DEFAULT_GLASS_OPACITY : glassOpacity,
      setGlassOpacity: isPublic ? () => {} : setGlassOpacity,
      bgIndex, setBgIndex,
      autoBg: isPublic ? DEFAULT_AUTO_BG : autoBg,
      setAutoBg: isPublic ? () => {} : setAutoBg,
      theme, THEMES: allThemes,
      customTheme, setCustomTheme,
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
