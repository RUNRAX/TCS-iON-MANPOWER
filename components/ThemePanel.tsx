"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Palette } from "lucide-react";
import { useTheme, THEMES } from "@/lib/context/ThemeContext";

interface ThemePanelProps { size?: "sm" | "md"; }

export default function ThemePanel({ size = "md" }: ThemePanelProps) {
  const { dark, setDark, themeKey, setThemeKey, customTheme, setCustomTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const textMuted  = dark ? "rgba(200,195,240,0.45)" : "rgba(30,20,80,0.4)";
  const panelBg    = dark ? "rgba(12,9,28,0.48)" : "rgba(255,255,255,0.35)";
  const btnSize    = size === "sm" ? { width: 32, height: 32, borderRadius: 10 } : { width: 38, height: 38, borderRadius: 12 };
  const iconSize   = size === "sm" ? 14 : 16;
  const topOffset  = size === "sm" ? 60 : 68;

  // Glass frost button style — premium frosted glass with edge lighting
  const btnBase: React.CSSProperties = {
    ...btnSize,
    background: dark
      ? "rgba(255,255,255,0.08)"
      : "rgba(255,255,255,0.30)",
    border: `1px solid ${dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.65)"}`,
    outline: "none",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--tc-primary)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    boxShadow: dark
      ? "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -0.5px 0 rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.25)"
      : "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -0.5px 0 rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.06)",
    transition: "background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
  };

  const paletteActive: React.CSSProperties = open ? {
    background: dark
      ? "rgba(255,255,255,0.14)"
      : "rgba(255,255,255,0.45)",
    borderColor: dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.65)",
    boxShadow: dark
      ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.30), 0 0 0 2px color-mix(in srgb, var(--tc-primary) 30%, transparent)"
      : "inset 0 1px 0 rgba(255,255,255,0.90), 0 4px 12px rgba(0,0,0,0.08), 0 0 0 2px color-mix(in srgb, var(--tc-primary) 20%, transparent)",
  } : {};

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

      {/* Dark / Light toggle */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={() => setDark(d => !d)}
        title={dark ? "Switch to light" : "Switch to dark"}
        style={btnBase}
      >
        {dark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
      </motion.button>

      {/* Palette button */}
      <div style={{ position: "relative" }} ref={panelRef}>
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={() => setOpen(o => !o)}
          style={{ ...btnBase, ...paletteActive }}
        >
          <Palette size={iconSize} />
        </motion.button>

        {/* Theme panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="theme-panel"
              initial={{ opacity: 0, y: -12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: -8,   scale: 0.95 }}
              transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.75 }}
              style={{
                position: "absolute",
                top: "calc(100% + 14px)", right: 0,
                zIndex: 9999,
                width: 220,
                borderRadius: 18,
                padding: 14,
                background: "var(--spatial-glass-bg)",
                border: "var(--spatial-glass-border)",
                backdropFilter: "var(--spatial-glass-blur)",
                WebkitBackdropFilter: "var(--spatial-glass-blur)",
                boxShadow: "var(--spatial-glass-shadow)",
                willChange: "transform, opacity",
                transform: "translateZ(0)",
              }}
            >
              {/* Preset swatches */}
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: textMuted, marginBottom: 12, textTransform: "uppercase" }}>
                THEMES
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7, marginBottom: 16 }}>
                {Object.entries(THEMES).map(([key, th]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { setThemeKey(key); setOpen(false); }}
                    title={th.name}
                    style={{
                      width: 32, height: 32, borderRadius: 9, border: "none",
                      // Swatch gradients use the theme's own hex values (not CSS vars) — this is fine
                      // because swatches are decorative and don't participate in hydration
                      background: `linear-gradient(135deg, ${th.swatch[0]}, ${th.swatch[1]})`,
                      cursor: "pointer",
                      outline: themeKey === key ? `2.5px solid ${th.swatch[0]}` : "2px solid transparent",
                      outlineOffset: 2,
                      transform: themeKey === key ? "scale(1.1)" : "scale(1)",
                      transition: "outline 0.15s, transform 0.15s, box-shadow 0.15s",
                      boxShadow: themeKey === key ? `0 4px 16px ${th.swatch[0]}60` : "none",
                    }}
                  />
                ))}
              </div>

              {/* Custom theme */}
              <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`, paddingTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: textMuted, textTransform: "uppercase" }}>CUSTOM</p>
                  <button
                    onClick={() => setThemeKey("custom")}
                    style={{
                      fontSize: 9, padding: "3px 10px", borderRadius: 7,
                      background: themeKey === "custom" ? "var(--tc-primary)" : `color-mix(in srgb, var(--tc-primary) 9%, transparent)`,
                      color: themeKey === "custom" ? "#fff" : "var(--tc-primary)",
                      border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)`,
                      cursor: "pointer", fontWeight: 700, letterSpacing: 1, transition: "all 0.2s",
                    }}>
                    {themeKey === "custom" ? "✓ ACTIVE" : "USE"}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {(["primary", "secondary", "accent"] as const).map(field => (
                    <div key={field} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label style={{ fontSize: 10, color: textMuted, width: 60, letterSpacing: 1, textTransform: "uppercase", flexShrink: 0 }}>
                        {field}
                      </label>
                      <input
                        type="color"
                        value={customTheme[field]}
                        onChange={e => { setCustomTheme({ [field]: e.target.value }); if (themeKey !== "custom") setThemeKey("custom"); }}
                        style={{ flex: 1, height: 30, borderRadius: 8, border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, cursor: "pointer", padding: 2, background: "transparent" }}
                      />
                      <span style={{ fontSize: 9, color: textMuted, fontFamily: "monospace", width: 52, letterSpacing: 0.5, flexShrink: 0 }}>
                        {customTheme[field]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
