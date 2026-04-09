"use client";
/**
 * app/(super)/super/settings/page.tsx — Platform Settings
 *
 * Environment status checker, active center codes list,
 * security settings, and the red Danger Zone.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
} from "lucide-react";

/* ── Master palette ───────────────────────────────────────────────────────── */
const MASTER_PALETTE = {
  primary: "#1a6fff",
  secondary: "#0a3fa8",
  accent: "#67e8f9",
};

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
  { key: "GOOGLE_GEMINI_API_KEY", label: "Google Gemini API Key", icon: Key },
  { key: "UPSTASH_REDIS_REST_URL", label: "Upstash Redis URL", icon: Server },
  { key: "ENCRYPTION_KEY", label: "Encryption Key", icon: Shield },
] as const;

export default function SuperSettingsPage() {
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();

  // ── Style tokens
  const iceBorder = dark
    ? "rgba(100,200,255,0.12)"
    : "rgba(80,160,255,0.25)";
  const dimText = dark
    ? "rgba(160,200,255,0.50)"
    : "rgba(20,80,180,0.55)";

  const masterGlass = {
    background: dark
      ? `rgba(4, 8, 32, ${(0.78 * glassOpacity / 100).toFixed(2)})`
      : `rgba(220, 235, 255, ${(0.6 * glassOpacity / 100).toFixed(2)})`,
    backdropFilter: glassFrost
      ? `blur(${glassBlur + 24}px) saturate(250%) brightness(${dark ? 1.08 : 1.02})`
      : "none",
    WebkitBackdropFilter: glassFrost
      ? `blur(${glassBlur + 24}px) saturate(250%) brightness(${dark ? 1.08 : 1.02})`
      : "none",
    border: `1px solid ${iceBorder}`,
    boxShadow: dark
      ? `inset 0 1px 0 rgba(120,200,255,0.12), 0 24px 64px rgba(0,5,30,0.65), 0 4px 20px rgba(0,0,0,0.4)`
      : `inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(20,80,200,0.10), 0 2px 8px rgba(0,0,0,0.06)`,
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

  // ── Determine env var presence from health check
  const getEnvStatus = (key: string): boolean | null => {
    if (!healthData) return null;
    // The health endpoint may return env keys; we check if it mentions them
    const envKeys = healthData.env ?? healthData.data?.env ?? {};
    return !!envKeys[key];
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Grid overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(100,180,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,180,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          animation: "gridPulse 4s ease-in-out infinite",
        }}
      />

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
        <motion.div variants={item} style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: dark ? "#e8f4ff" : "#0a2060",
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
            System configuration & environment status
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 1: Environment Status
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          variants={item}
          style={{ ...masterGlass, padding: "24px 26px", marginBottom: 20 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Server size={16} color={MASTER_PALETTE.accent} />
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: dark ? "#a0d4ff" : "#1a5fa8",
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
                border: `1px solid ${iceBorder}`,
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
                    background: dark
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.02)",
                    border: `1px solid ${dark ? "rgba(100,200,255,0.08)" : "rgba(80,160,255,0.12)"}`,
                  }}
                >
                  <Icon
                    size={14}
                    color={
                      status === null
                        ? dimText
                        : status
                          ? "#22c55e"
                          : "#ef4444"
                    }
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 600,
                      color: dark ? "#daeeff" : "#0a2060",
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {envVar.label}
                  </span>
                  {status === null ? (
                    <span
                      style={{
                        fontSize: 10,
                        color: dimText,
                        fontStyle: "italic",
                      }}
                    >
                      checking...
                    </span>
                  ) : status ? (
                    <CheckCircle2 size={16} color="#22c55e" />
                  ) : (
                    <XCircle size={16} color="#ef4444" />
                  )}
                </div>
              );
            })}
          </div>

          <p
            style={{
              fontSize: 11,
              color: dimText,
              marginTop: 14,
              fontStyle: "italic",
            }}
          >
            Only presence is checked — actual values are never exposed.
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2: Active Center Codes
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          variants={item}
          style={{ ...masterGlass, padding: "24px 26px", marginBottom: 20 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <MapPin size={16} color={MASTER_PALETTE.accent} />
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: dark ? "#a0d4ff" : "#1a5fa8",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              ACTIVE CENTER CODES
            </p>
          </div>

          {centerCodes.length === 0 ? (
            <p style={{ fontSize: 13, color: dimText }}>
              No center codes found. Create an admin to assign one.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {centerCodes.map((code) => (
                <div
                  key={code as string}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    background: dark
                      ? "rgba(26,111,255,0.10)"
                      : "rgba(26,111,255,0.06)",
                    border: `1px solid ${dark ? "rgba(26,111,255,0.20)" : "rgba(26,111,255,0.18)"}`,
                    fontSize: 14,
                    fontWeight: 700,
                    color: MASTER_PALETTE.accent,
                    fontFamily: "var(--font-jetbrains-mono)",
                    letterSpacing: 2,
                  }}
                >
                  {code as string}
                </div>
              ))}
            </div>
          )}

          <p
            style={{
              fontSize: 11,
              color: dimText,
              marginTop: 14,
            }}
          >
            Center codes are assigned when creating admin accounts via the Admin
            Accounts page.
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3: Security Settings
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          variants={item}
          style={{ ...masterGlass, padding: "24px 26px", marginBottom: 20 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <Shield size={16} color={MASTER_PALETTE.accent} />
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: dark ? "#a0d4ff" : "#1a5fa8",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              SECURITY
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Re-auth toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderRadius: 14,
                background: dark
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.02)",
                border: `1px solid ${dark ? "rgba(100,200,255,0.08)" : "rgba(80,160,255,0.12)"}`,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: dark ? "#daeeff" : "#0a2060",
                  }}
                >
                  Require re-auth for destructive actions
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: dimText,
                    marginTop: 2,
                  }}
                >
                  Prompts for password before deactivating users or deleting
                  data.
                </p>
              </div>
              <div
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: dark
                    ? "rgba(34,197,94,0.20)"
                    : "rgba(34,197,94,0.15)",
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
                background: dark
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.02)",
                border: `1px solid ${dark ? "rgba(100,200,255,0.08)" : "rgba(80,160,255,0.12)"}`,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: dark ? "#daeeff" : "#0a2060",
                  }}
                >
                  Session timeout
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: dimText,
                    marginTop: 2,
                  }}
                >
                  Auto-logout after inactivity period (managed by Supabase
                  Auth).
                </p>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: MASTER_PALETTE.accent,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
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
            borderColor: dark
              ? "rgba(239,68,68,0.25)"
              : "rgba(239,68,68,0.35)",
            boxShadow: dark
              ? `inset 0 1px 0 rgba(239,68,68,0.08), 0 24px 64px rgba(0,5,30,0.65)`
              : `inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(239,68,68,0.08)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
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
              background: dark
                ? "rgba(239,68,68,0.05)"
                : "rgba(239,68,68,0.03)",
              border: `1px solid ${dark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.20)"}`,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Database size={14} color="#ef4444" />
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#ef4444",
                  }}
                >
                  Export complete database backup
                </p>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: dimText,
                  marginTop: 4,
                }}
              >
                Opens the Supabase Dashboard where you can export full database
                backups.
              </p>
            </div>
            <motion.button
              whileHover={{
                scale: 1.03,
                boxShadow: "0 8px 24px rgba(239,68,68,0.30)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const supabaseUrl =
                  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
                const projectRef = supabaseUrl
                  .replace("https://", "")
                  .replace(".supabase.co", "");
                window.open(
                  `https://supabase.com/dashboard/project/${projectRef}/settings/database`,
                  "_blank"
                );
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

      <style jsx global>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.12; }
        }
      `}</style>
    </div>
  );
}
