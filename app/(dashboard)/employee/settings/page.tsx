"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme, THEMES } from "@/lib/context/ThemeContext";
import {
  Settings, Palette, Sun, Moon, Layers, Eye, SlidersHorizontal, Check,
} from "lucide-react";

export default function EmployeeSettings() {
  const {
    dark, setDark, themeKey, setThemeKey,
    glassFrost, setGlassFrost, glassBlur, setGlassBlur, glassOpacity, setGlassOpacity,
  } = useTheme();

  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const border    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <div style={{ padding: "24px 28px", maxWidth: 700, margin: "0 auto", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", boxShadow: "0 6px 20px color-mix(in srgb, var(--tc-primary) 30%, transparent)" }}>
            <Settings size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textMain, letterSpacing: -0.3 }}>Settings</h1>
            <p style={{ fontSize: 12, color: textMuted }}>Customize your portal experience</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Appearance ── */}
        <div className="admin-panel" style={{ position: "relative", borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" }}>
              <Palette size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: textMain }}>Appearance</h2>
              <p style={{ fontSize: 11, color: textMuted }}>Choose your theme and mode</p>
            </div>
          </div>

          {/* Dark/Light toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "12px 0", borderBottom: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {dark ? <Moon size={15} style={{ color: "var(--tc-primary)" }} /> : <Sun size={15} style={{ color: "#f59e0b" }} />}
              <span style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{dark ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setDark(!dark)}
              style={{
                width: 44, height: 24, borderRadius: 99, cursor: "pointer", border: "none",
                background: dark ? "var(--tc-primary)" : "rgba(0,0,0,0.15)",
                position: "relative", transition: "background 0.3s",
              }}>
              <motion.div
                animate={{ x: dark ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
              />
            </motion.button>
          </div>

          {/* Theme grid */}
          <p style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Color Theme</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {Object.entries(THEMES).map(([key, t]) => {
              const isActive = key === themeKey;
              return (
                <motion.button key={key} whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setThemeKey(key)}
                  className="admin-panel"
                  style={{
                    position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    padding: "10px 4px", borderRadius: 12, cursor: "pointer",
                    background: isActive ? "color-mix(in srgb, var(--tc-primary) 15%, transparent)" : "transparent",
                    border: isActive ? "1px solid var(--tc-primary)" : "1px solid transparent",
                    transition: "all 0.22s",
                  }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {t.swatch.map((c, i) => (
                      <div key={i} style={{ width: 12, height: 12, borderRadius: 4, background: c, boxShadow: `0 0 6px ${c}40` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--tc-primary)" : textMuted }}>{t.name}</span>
                  {isActive && <Check size={10} style={{ position: "absolute", top: 4, right: 4, color: "var(--tc-primary)" }} />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Glass Frost Mode ── */}
        <div className="admin-panel" style={{ position: "relative", borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" }}>
              <Layers size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: textMain }}>Glass Frost Mode</h2>
              <p style={{ fontSize: 11, color: textMuted }}>Control the visual design of your interface</p>
            </div>
          </div>

          {/* Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: `1px solid ${border}`, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: textMain }}>Glass Frost Effect</p>
              <p style={{ fontSize: 11, color: textMuted }}>Enable the frosted glass transparency effect across all panels</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setGlassFrost(!glassFrost)}
              style={{
                width: 44, height: 24, borderRadius: 99, cursor: "pointer", border: "none",
                background: glassFrost ? "var(--tc-primary)" : "rgba(120,120,140,0.3)",
                position: "relative", transition: "background 0.3s",
              }}>
              <motion.div
                animate={{ x: glassFrost ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
              />
            </motion.button>
          </div>

          {/* Blur slider */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: textMain }}>Blur Intensity</p>
              <span style={{ fontSize: 11, color: textMuted }}>{glassBlur}px</span>
            </div>
            <p style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>Adjust the backdrop blur strength</p>
            <input type="range" min={0} max={72} value={glassBlur} onChange={e => setGlassBlur(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--tc-primary)" }} />
          </div>

          {/* Opacity slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: textMain }}>Transparency Level</p>
              <span style={{ fontSize: 11, color: textMuted }}>{glassOpacity}%</span>
            </div>
            <p style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>Set the panel opacity level</p>
            <input type="range" min={10} max={100} value={glassOpacity} onChange={e => setGlassOpacity(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--tc-primary)" }} />
          </div>
        </div>

      </div>
    </div>
  );
}
