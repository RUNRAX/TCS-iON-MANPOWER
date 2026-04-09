"use client";
/**
 * app/(super)/super/dashboard/page.tsx — Command Center
 *
 * Cinematic war-room dashboard for the master admin.
 * 6-up stat grid, center breakdown table, AI analysis with typewriter,
 * and quick action buttons. Cold ice-blue palette throughout.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  CalendarDays,
  IndianRupee,
  Clock,
  CheckCircle2,
  Plus,
  Radio,
  Download,
  Activity,
  Sparkles,
  TrendingUp,
} from "lucide-react";

/* ── Master palette ───────────────────────────────────────────────────────── */
const MASTER_PALETTE = {
  primary: "#1a6fff",
  secondary: "#0a3fa8",
  accent: "#67e8f9",
  glow: "rgba(26,111,255,0.18)",
  glowStrong: "rgba(26,111,255,0.35)",
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

/* ── Stat card config ─────────────────────────────────────────────────────── */
const STAT_CARDS = [
  { key: "totalAdmins", label: "TOTAL ADMINS", icon: Users, format: "number" },
  { key: "totalEmployees", label: "TOTAL EMPLOYEES", icon: Users, format: "number" },
  { key: "activeEmployees", label: "ACTIVE EMPLOYEES", icon: UserCheck, format: "number" },
  { key: "publishedShifts", label: "PUBLISHED SHIFTS", icon: CalendarDays, format: "number" },
  { key: "totalPaymentsAllTime", label: "TOTAL PAYMENTS", icon: IndianRupee, format: "currency" },
  { key: "pendingPayments", label: "PENDING PAYMENTS", icon: Clock, format: "number" },
] as const;

export default function SuperDashboardPage() {
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();
  const router = useRouter();

  // ── IST clock
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Stats data
  const { data: stats, isLoading } = useQuery({
    queryKey: ["super", "stats"],
    queryFn: () =>
      fetch("/api/super/stats")
        .then((r) => r.json())
        .then((d) => d.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // ── AI summary
  const { data: aiData } = useQuery({
    queryKey: ["admin", "ai-summary"],
    queryFn: () =>
      fetch("/api/admin/ai-summary")
        .then((r) => r.json())
        .then((d) => d.data)
        .catch(() => null),
    staleTime: 120_000,
    retry: false,
  });

  // ── Typewriter effect for AI summary
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const text = aiData?.summary ?? "";
    if (!text) return;
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      if (i < text.length) {
        setTyped((prev: string) => prev + text[i]);
        i++;
      } else {
        clearInterval(id);
      }
    }, 25);
    return () => clearInterval(id);
  }, [aiData?.summary]);

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
      ? `inset 0 1px 0 rgba(120,200,255,0.12), 0 0 0 1px rgba(30,100,255,0.06) inset, 0 24px 64px rgba(0,5,30,0.65), 0 4px 20px rgba(0,0,0,0.4)`
      : `inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(20,80,200,0.10), 0 2px 8px rgba(0,0,0,0.06)`,
    borderRadius: 24,
  };

  const formatValue = (key: string, val: any) => {
    if (val === undefined || val === null) return "—";
    const card = STAT_CARDS.find((c) => c.key === key);
    if (card?.format === "currency") {
      return `₹${Number(val).toLocaleString("en-IN")}`;
    }
    return Number(val).toLocaleString("en-IN");
  };

  const centerBreakdown = stats?.centerBreakdown
    ? Object.entries(stats.centerBreakdown as Record<string, { shifts: number; employees: number }>)
    : [];

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* ── Animated grid overlay ── */}
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
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* ── Header strip ── */}
        <motion.div
          variants={item}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
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
              MASTER CONTROL PANEL
            </h1>
            <p
              style={{
                fontSize: 12,
                color: dimText,
                marginTop: 4,
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              Cross-center command interface
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* System status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 12,
                ...masterGlass,
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px rgba(34,197,94,0.6)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: dark ? "#a0d4ff" : "#1a5fa8",
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                All systems operational
              </span>
            </div>
            {/* IST time */}
            <div
              style={{
                ...masterGlass,
                borderRadius: 12,
                padding: "8px 14px",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: MASTER_PALETTE.accent,
                  fontFamily: "var(--font-jetbrains-mono)",
                  letterSpacing: 2,
                }}
              >
                {time} IST
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── 6-up stat grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            const val = stats?.[card.key];
            return (
              <motion.div
                key={card.key}
                variants={item}
                whileHover={{
                  y: -3,
                  boxShadow: `0 20px 60px rgba(26,111,255,0.25), ${masterGlass.boxShadow}`,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  ...masterGlass,
                  padding: "20px 22px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default",
                }}
              >
                {/* Ice glow top-left corner */}
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    left: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(30,100,255,0.20) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                {/* Thin accent line at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "10%",
                    right: "10%",
                    height: 2,
                    borderRadius: 2,
                    background:
                      "linear-gradient(90deg, transparent, #1a6fff, #67e8f9, #1a6fff, transparent)",
                    opacity: 0.6,
                  }}
                />
                {/* Content */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2.5,
                      textTransform: "uppercase",
                      color: dimText,
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {card.label}
                  </p>
                  <Icon
                    size={16}
                    color={dark ? "rgba(160,200,255,0.35)" : "rgba(30,80,180,0.30)"}
                  />
                </div>
                <p
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: dark ? "#e8f4ff" : "#0a2060",
                    fontFamily: "var(--font-outfit)",
                    marginTop: 4,
                  }}
                >
                  {isLoading ? "—" : formatValue(card.key, val)}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Center breakdown table + AI analysis row ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {/* Center breakdown table */}
          <motion.div
            variants={item}
            style={{ ...masterGlass, padding: "24px 22px", overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <TrendingUp size={16} color={MASTER_PALETTE.accent} />
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
                CENTER BREAKDOWN
              </p>
            </div>

            {centerBreakdown.length === 0 && !isLoading ? (
              <p style={{ fontSize: 13, color: dimText }}>
                No center data available yet.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr>
                      {["Center Code", "Shifts", "Status"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            color: dimText,
                            fontFamily: "var(--font-jetbrains-mono)",
                            borderBottom: `1px solid ${iceBorder}`,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {centerBreakdown.map(([code, data]: [string, any]) => (
                      <tr
                        key={code}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = dark
                            ? "rgba(26,111,255,0.06)"
                            : "rgba(20,80,200,0.04)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        style={{ transition: "background 0.15s ease" }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            fontWeight: 700,
                            color: MASTER_PALETTE.accent,
                            fontFamily: "var(--font-jetbrains-mono)",
                            borderBottom: `1px solid ${dark ? "rgba(100,200,255,0.06)" : "rgba(80,160,255,0.10)"}`,
                          }}
                        >
                          {code}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: dark ? "#e8f4ff" : "#0a2060",
                            borderBottom: `1px solid ${dark ? "rgba(100,200,255,0.06)" : "rgba(80,160,255,0.10)"}`,
                          }}
                        >
                          {data.shifts}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            borderBottom: `1px solid ${dark ? "rgba(100,200,255,0.06)" : "rgba(80,160,255,0.10)"}`,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: 8,
                              fontSize: 10,
                              fontWeight: 700,
                              background: dark
                                ? "rgba(34,197,94,0.12)"
                                : "rgba(34,197,94,0.08)",
                              color: "#22c55e",
                              border: `1px solid rgba(34,197,94,0.20)`,
                            }}
                          >
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* AI Analysis card */}
          <motion.div
            variants={item}
            style={{ ...masterGlass, padding: "24px 22px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: dark
                    ? "rgba(26,111,255,0.15)"
                    : "rgba(26,111,255,0.08)",
                  border: `1px solid ${dark ? "rgba(26,111,255,0.25)" : "rgba(26,111,255,0.20)"}`,
                }}
              >
                <Sparkles size={12} color={MASTER_PALETTE.accent} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: MASTER_PALETTE.accent,
                    fontFamily: "var(--font-jetbrains-mono)",
                  }}
                >
                  AI ANALYSIS
                </span>
              </div>
            </div>

            <div
              style={{
                minHeight: 120,
                fontSize: 13,
                lineHeight: 1.7,
                color: dark ? "rgba(200,220,255,0.75)" : "rgba(20,60,140,0.70)",
              }}
            >
              {typed ? (
                <span>
                  {typed}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{ color: MASTER_PALETTE.accent }}
                  >
                    ▊
                  </motion.span>
                </span>
              ) : (
                <span style={{ color: dimText, fontStyle: "italic" }}>
                  {aiData === null
                    ? "AI analysis unavailable — API key may not be configured."
                    : "Generating system analysis..."}
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Quick actions row ── */}
        <motion.div variants={item}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: dimText,
              fontFamily: "var(--font-jetbrains-mono)",
              marginBottom: 12,
            }}
          >
            QUICK ACTIONS
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            {[
              { label: "Create Admin", icon: Plus, href: "/super/admins" },
              { label: "System Broadcast", icon: Radio, href: "/super/broadcast" },
              { label: "Export Data", icon: Download, href: "/api/super/export", external: true },
              { label: "View Audit Log", icon: Activity, href: "/super/activity" },
            ].map((action) => (
              <motion.button
                key={action.label}
                whileHover={{
                  scale: 1.02,
                  boxShadow: `0 12px 40px rgba(26,111,255,0.30), ${masterGlass.boxShadow}`,
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (action.external) {
                    window.open(action.href, "_blank");
                  } else {
                    router.push(action.href);
                  }
                }}
                style={{
                  ...masterGlass,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  transition: "all 0.22s ease",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${MASTER_PALETTE.primary}, ${MASTER_PALETTE.secondary})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 12px rgba(26,111,255,0.30)`,
                  }}
                >
                  <action.icon size={16} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: dark ? "#daeeff" : "#0a2060",
                  }}
                >
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Inject gridPulse keyframes ── */}
      <style jsx global>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.12; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
