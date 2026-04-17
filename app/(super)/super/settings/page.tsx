"use client";
/**
 * app/(super)/super/settings/page.tsx — Platform Settings
 *
 * Aesthetic Engine (glass frost controls + theme picker),
 * Environment status checker, active center codes list,
 * security settings, and the Danger Zone.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTheme, THEMES } from "@/lib/context/ThemeContext";
import ThemePanel from "@/components/ThemePanel";
import {
  Shield,
  Key,
  Server,
  CheckCircle2,
  XCircle,
  MapPin,
  AlertTriangle,
  Database,
  RefreshCw,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Eye,
  Layers,
} from "lucide-react";

/* ── Animations ───────────────────────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};
const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

/* ── Environment variables to check ───────────────────────────────────────── */
const ENV_VARS = [
  { key: "RESEND_API_KEY", label: "Resend API Key", icon: Key },
  { key: "MAILJET_API_KEY", label: "Mailjet API Key", icon: Key },
  { key: "GROQ_API_KEY", label: "Groq AI API Key (Llama)", icon: Key },
  { key: "UPSTASH_REDIS_REST_URL", label: "Upstash Redis URL", icon: Server },
  { key: "ENCRYPTION_KEY", label: "Encryption Key", icon: Shield },
] as const;

export default function SuperSettingsPage() {
  const {
    dark, setDark,
    glassFrost, setGlassFrost,
    glassBlur, setGlassBlur,
    glassOpacity, setGlassOpacity,
    themeKey, setThemeKey,
    theme,
  } = useTheme();

  // Glass frost bindings
  const dimText = dark
    ? "rgba(255,255,255,0.50)"
    : "rgba(0,0,0,0.55)";

  const masterGlass = {
    background: "var(--spatial-glass-bg)",
    backdropFilter: "var(--spatial-glass-blur)",
    WebkitBackdropFilter: "var(--spatial-glass-blur)",
    border: "var(--spatial-glass-border)",
    boxShadow: "var(--spatial-glass-shadow)",
    borderRadius: 24,
  };

  // ── Health check for env status
  const {
    data: healthData,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["super", "health"],
    queryFn: () =>
      fetch("/api/health")
        .then((r) => r.json())
        .catch(() => null),
    staleTime: 60_000,
  });

  // ── Fetch admins for center codes
  const { data: adminsData } = useQuery({
    queryKey: ["super", "admins"],
    queryFn: () =>
      fetch("/api/super/admins")
        .then((r) => r.json())
        .then((d) => d.data),
    staleTime: 60_000,
  });

  const centerCodes = adminsData?.admins
    ? [
        ...new Set(
          (adminsData.admins as any[])
            .map((a: any) => a.centerCode)
            .filter(Boolean)
        ),
      ]
    : [];

  const getEnvStatus = (key: string): boolean | null => {
    if (!healthData) return null;
    const envKeys = healthData.env ?? healthData.data?.env ?? {};
    return !!envKeys[key];
  };

  /* ── Slider component ─────────────────────────────────────────────────── */
  const Slider = ({ label, value, onChange, min = 0, max = 100, icon: Icon }: {
    label: string; value: number; onChange: (v: number) => void;
    min?: number; max?: number; icon: React.ComponentType<any>;
  }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <Icon size={14} color="var(--tc-primary)" style={{ flexShrink: 0 }} />
      <span style={{
        fontSize: 11, fontWeight: 600, color: dark ? "#fff" : "var(--tc-primary)",
        width: 70, flexShrink: 0, letterSpacing: 0.5,
      }}>{label}</span>
      <div style={{ flex: 1, position: "relative", height: 6, borderRadius: 3, overflow: "hidden",
        background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${((value - min) / (max - min)) * 100}%`,
          background: `linear-gradient(90deg, var(--tc-primary), var(--tc-secondary))`,
          borderRadius: 3, transition: "width 0.15s ease",
        }} />
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
          opacity: 0, cursor: "pointer",
        }}
      />
      {/* Overlay invisible range input */}
      <div style={{ position: "relative", flex: 1, height: 24, marginLeft: -14, marginRight: -14 }}>
        <input
          type="range" min={min} max={max} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", zIndex: 2, margin: 0,
          }}
        />
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700, color: "var(--tc-accent)",
        fontFamily: "var(--font-jetbrains-mono)", width: 32, textAlign: "right", flexShrink: 0,
      }}>{value}</span>
    </div>
  );

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          position: "relative",
          zIndex: 1,
          padding: "32px 28px 48px",
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        {/* ── Header ── */}
        <motion.div variants={item} style={{
          marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "relative", zIndex: 100,
        }}>
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: dark ? "#fff" : "var(--tc-primary)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              PLATFORM SETTINGS
            </h1>
            <p
              style={{
                fontSize: 12,
                color: dimText,
                marginTop: 4,
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              System configuration, aesthetics & environment status
            </p>
          </div>
          
          {/* Quick theme toggle in header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--tc-primary)", letterSpacing: 1, textTransform: "uppercase" }}>Theme Engine</p>
              <p style={{ fontSize: 9, color: dimText }}>Aesthetic Control</p>
            </div>
            <ThemePanel size="md" />
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 0: AESTHETIC ENGINE — Glass Frost Controls
            ═══════════════════════════════════════════════════════ */}
        <motion.div variants={item} style={{ ...masterGlass, padding: "24px 26px", marginBottom: 20, position: "relative", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <Sparkles size={16} color="var(--tc-accent)" />
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: dark ? "#fff" : "var(--tc-primary)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              AESTHETIC ENGINE
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Left — Toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Dark mode toggle */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", borderRadius: 14,
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {dark ? <Moon size={14} color="var(--tc-primary)" /> : <Sun size={14} color="var(--tc-primary)" />}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: dark ? "#fff" : "var(--tc-primary)" }}>
                      {dark ? "Dark Mode" : "Light Mode"}
                    </p>
                    <p style={{ fontSize: 10, color: dimText, marginTop: 1 }}>Toggle appearance</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDark(!dark)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, position: "relative", cursor: "pointer",
                    background: dark
                      ? `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`
                      : "rgba(0,0,0,0.15)",
                    border: "none", transition: "background 0.3s ease",
                  }}
                >
                  <motion.div
                    animate={{ left: dark ? 22 : 3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                      position: "absolute", top: 3, width: 18, height: 18,
                      borderRadius: "50%", background: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </motion.button>
              </div>

              {/* Glass Frost toggle */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", borderRadius: 14,
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Layers size={14} color="var(--tc-primary)" />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: dark ? "#fff" : "var(--tc-primary)" }}>
                      Glass Frost Effect
                    </p>
                    <p style={{ fontSize: 10, color: dimText, marginTop: 1 }}>Frosted glass UI</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGlassFrost(!glassFrost)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, position: "relative", cursor: "pointer",
                    background: glassFrost
                      ? `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`
                      : "rgba(0,0,0,0.15)",
                    border: "none", transition: "background 0.3s ease",
                  }}
                >
                  <motion.div
                    animate={{ left: glassFrost ? 22 : 3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                      position: "absolute", top: 3, width: 18, height: 18,
                      borderRadius: "50%", background: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </motion.button>
              </div>
            </div>

            {/* Right — Sliders + Theme indicator */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Blur control */}
              <div
                style={{
                  padding: "14px 18px", borderRadius: 14,
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Eye size={14} color="var(--tc-primary)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: dark ? "#fff" : "var(--tc-primary)" }}>
                    Blur Intensity
                  </span>
                  <span style={{
                    marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--tc-accent)",
                    fontFamily: "var(--font-jetbrains-mono)",
                  }}>{glassBlur}</span>
                </div>
                <div style={{ position: "relative", height: 6, borderRadius: 3 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 3,
                    background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  }} />
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${glassBlur}%`, borderRadius: 3,
                    background: `linear-gradient(90deg, var(--tc-primary), var(--tc-secondary))`,
                    transition: "width 0.15s ease",
                  }} />
                  <input
                    type="range" min={0} max={100} value={glassBlur}
                    onChange={(e) => setGlassBlur(Number(e.target.value))}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: 20, top: -7,
                      opacity: 0, cursor: "pointer", margin: 0,
                    }}
                  />
                </div>
              </div>

              {/* Opacity control */}
              <div
                style={{
                  padding: "14px 18px", borderRadius: 14,
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Palette size={14} color="var(--tc-primary)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: dark ? "#fff" : "var(--tc-primary)" }}>
                    Glass Opacity
                  </span>
                  <span style={{
                    marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--tc-accent)",
                    fontFamily: "var(--font-jetbrains-mono)",
                  }}>{glassOpacity}</span>
                </div>
                <div style={{ position: "relative", height: 6, borderRadius: 3 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 3,
                    background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  }} />
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${glassOpacity}%`, borderRadius: 3,
                    background: `linear-gradient(90deg, var(--tc-primary), var(--tc-secondary))`,
                    transition: "width 0.15s ease",
                  }} />
                  <input
                    type="range" min={0} max={100} value={glassOpacity}
                    onChange={(e) => setGlassOpacity(Number(e.target.value))}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: 20, top: -7,
                      opacity: 0, cursor: "pointer", margin: 0,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active theme indicator */}
          <div style={{
            marginTop: 16, padding: "10px 16px", borderRadius: 10,
            background: `color-mix(in srgb, var(--tc-primary) 8%, transparent)`,
            border: `1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`,
                boxShadow: `0 2px 8px color-mix(in srgb, var(--tc-primary) 30%, transparent)`,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, color: "var(--tc-primary)",
                letterSpacing: 1, textTransform: "uppercase",
                fontFamily: "var(--font-jetbrains-mono)",
              }}>
                {THEMES[themeKey as keyof typeof THEMES]?.name ?? "Custom"}
              </span>
            </div>
            <span style={{ fontSize: 10, color: dimText, fontFamily: "var(--font-jetbrains-mono)" }}>
              Frost: {glassFrost ? "ON" : "OFF"} · Blur: {glassBlur} · Opacity: {glassOpacity}
            </span>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 1: Environment Status
            ═══════════════════════════════════════════════════════ */}
        <motion.div variants={item} style={{ ...masterGlass, padding: "24px 26px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Server size={16} color="var(--tc-accent)" />
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: dark ? "#fff" : "var(--tc-primary)",
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                ENVIRONMENT STATUS
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                refetchHealth();
                toast.success("Refreshing environment status...");
              }}
              style={{
                background: "transparent",
                border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)`,
                borderRadius: 8,
                padding: "6px 8px",
                cursor: "pointer",
                color: dimText,
              }}
            >
              <RefreshCw size={14} />
            </motion.button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {ENV_VARS.map((envVar) => {
              const status = getEnvStatus(envVar.key);
              const Icon = envVar.icon;
              return (
                <div
                  key={envVar.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 14,
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  }}
                >
                  <Icon
                    size={14}
                    color={status === null ? dimText : status ? "#22c55e" : "#ef4444"}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 600,
                      color: dark ? "#fff" : "var(--tc-primary)",
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {envVar.label}
                  </span>
                  {status === null ? (
                    <span style={{ fontSize: 10, color: dimText, fontStyle: "italic" }}>checking...</span>
                  ) : status ? (
                    <CheckCircle2 size={16} color="#22c55e" />
                  ) : (
                    <XCircle size={16} color="#ef4444" />
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 11, color: dimText, marginTop: 14, fontStyle: "italic" }}>
            Only presence is checked — actual values are never exposed.
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2: Active Center Codes
            ═══════════════════════════════════════════════════════ */}
        <motion.div variants={item} style={{ ...masterGlass, padding: "24px 26px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <MapPin size={16} color="var(--tc-accent)" />
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: dark ? "#fff" : "var(--tc-primary)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              ACTIVE CENTER CODES
            </p>
          </div>

          {centerCodes.length === 0 ? (
            <p style={{ fontSize: 13, color: dimText }}>No center codes found. Create an admin to assign one.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {centerCodes.map((code) => (
                <div
                  key={code as string}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    background: `color-mix(in srgb, var(--tc-primary) 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)`,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--tc-accent)",
                    fontFamily: "var(--font-jetbrains-mono)",
                    letterSpacing: 2,
                  }}
                >
                  {code as string}
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: 11, color: dimText, marginTop: 14 }}>
            Center codes are assigned when creating admin accounts via the Admin Accounts page.
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3: Security Settings
            ═══════════════════════════════════════════════════════ */}
        <motion.div variants={item} style={{ ...masterGlass, padding: "24px 26px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <Shield size={16} color="var(--tc-accent)" />
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: dark ? "#fff" : "var(--tc-primary)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              SECURITY
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Re-auth toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderRadius: 14,
                background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: dark ? "#fff" : "var(--tc-primary)" }}>
                  Require re-auth for destructive actions
                </p>
                <p style={{ fontSize: 11, color: dimText, marginTop: 2 }}>
                  Prompts for password before deactivating users or deleting data.
                </p>
              </div>
              <div
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: dark ? "rgba(34,197,94,0.20)" : "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.30)",
                  position: "relative",
                  cursor: "not-allowed",
                  opacity: 0.6,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: 22,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#22c55e",
                    transition: "left 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Session timeout */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderRadius: 14,
                background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: dark ? "#fff" : "var(--tc-primary)" }}>
                  Session timeout
                </p>
                <p style={{ fontSize: 11, color: dimText, marginTop: 2 }}>
                  Auto-logout after inactivity period (managed by Supabase Auth).
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tc-accent)", fontFamily: "var(--font-jetbrains-mono)" }}>
                 1 hour
              </span>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 4: Danger Zone
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          variants={item}
          style={{
            ...masterGlass,
            padding: "24px 26px",
            borderColor: dark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.35)",
            background: "var(--spatial-glass-bg)",
            boxShadow: dark
              ? `inset 0 1px 0 rgba(239,68,68,0.08), 0 24px 64px rgba(0,5,30,0.65)`
              : `inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(239,68,68,0.08)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <AlertTriangle size={16} color="#ef4444" />
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#ef4444",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              DANGER ZONE
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
              borderRadius: 14,
              background: dark ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.03)",
              border: `1px solid ${dark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.20)"}`,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Database size={14} color="#ef4444" />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
                  Export complete database backup
                </p>
              </div>
              <p style={{ fontSize: 11, color: dimText, marginTop: 4 }}>
                Opens the Supabase Dashboard where you can export full database backups.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(239,68,68,0.30)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
                const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
                window.open(`https://supabase.com/dashboard/project/${projectRef}/settings/database`, "_blank");
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: 12,
                padding: "10px 18px",
                color: "#ef4444",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              Open Supabase →
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
