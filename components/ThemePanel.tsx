"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Palette } from "lucide-react";
import { useTheme, THEMES } from "@/lib/context/ThemeContext";

interface ThemePanelProps { size?: "sm" | "md"; }

export default function ThemePanel({ size = "md" }: ThemePanelProps) {
  const { dark, setDark, themeKey, setThemeKey, customTheme, setCustomTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const textMuted  = dark ? "rgba(200,195,240,0.45)" : "rgba(30,20,80,0.4)";
  const panelBg    = dark ? "rgba(8,6,20,0.98)" : "rgba(255,255,255,0.98)";
  const btnSize    = size === "sm" ? { width: 32, height: 32, borderRadius: 10 } : { width: 38, height: 38, borderRadius: 12 };
  const iconSize   = size === "sm" ? 14 : 16;
  const topOffset  = size === "sm" ? 60 : 68;

  // All button colours use CSS vars — same string on server & client, no hydration mismatch
  const btnBase: React.CSSProperties = {
    ...btnSize,
    background: "color-mix(in srgb, var(--tc-primary) 9%, transparent)",
    border: "1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--tc-primary)",
    backdropFilter: "blur(12px)",
    transition: "background 0.2s, outline 0.2s",
  };

  const paletteActive: React.CSSProperties = open ? {
    background: "color-mix(in srgb, var(--tc-primary) 20%, transparent)",
    outline: "2px solid color-mix(in srgb, var(--tc-primary) 40%, transparent)",
    outlineOffset: "1px",
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
      <div style={{ position: "relative" }}>
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={() => setOpen(o => !o)}
          style={{ ...btnBase, ...paletteActive }}
        >
          <Palette size={iconSize} />
        </motion.button>

        {/* Backdrop */}
        {open && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9990 }} onClick={() => setOpen(false)} />
        )}

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
                position: "fixed",
                top: topOffset, right: 16,
                zIndex: 9999,
                width: 260,
                borderRadius: 20,
                padding: 18,
                background: panelBg,
                border: "1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)",
                backdropFilter: "blur(32px)",
                boxShadow: "0 28px 80px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--tc-primary) 6%, transparent)",
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
                      width: 38, height: 38, borderRadius: 11, border: "none",
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
              <div style={{ borderTop: "1px solid color-mix(in srgb, var(--tc-primary) 9%, transparent)", paddingTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: textMuted, textTransform: "uppercase" }}>CUSTOM</p>
                  <button
                    onClick={() => setThemeKey("custom")}
                    style={{
                      fontSize: 9, padding: "3px 10px", borderRadius: 7,
                      background: themeKey === "custom" ? "var(--tc-primary)" : "color-mix(in srgb, var(--tc-primary) 9%, transparent)",
                      color: themeKey === "custom" ? "#fff" : "var(--tc-primary)",
                      border: "1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)",
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
                        style={{ flex: 1, height: 30, borderRadius: 8, border: "1px solid color-mix(in srgb, var(--tc-primary) 16%, transparent)", cursor: "pointer", padding: 2, background: "transparent" }}
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
