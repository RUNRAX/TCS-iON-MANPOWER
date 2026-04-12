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
import { useSuperStats } from "@/hooks/use-api";
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
  primary: "var(--tc-primary)",
  secondary: "var(--tc-secondary)",
  accent: "var(--tc-accent)",
  glow: "color-mix(in srgb, var(--tc-primary) 18%, transparent)",
  glowStrong: "color-mix(in srgb, var(--tc-primary) 35%, transparent)",
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

  // ── Stats data — shared hook ensures cache consistency across /super/* pages
  const { data: stats, isLoading } = useSuperStats();

  // ── AI summary (POST with metrics body — route only exports POST)
  const { data: aiData } = useQuery({
    queryKey: ["admin", "ai-summary", stats ? "loaded" : "pending"],
    queryFn: () =>
      fetch("/api/admin/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalEmployees: stats?.totalEmployees ?? 0,
          activeShifts: stats?.publishedShifts ?? 0,
          confirmedShifts: stats?.confirmedSlots ?? 0,
          pendingShifts: stats?.pendingPayments ?? 0,
          totalPaymentsThisMonth: stats?.totalPaymentsThisMonth ?? 0,
          pendingPayments: stats?.pendingPayments ?? 0,
          newRegistrationsThisWeek: 0,
          date: new Date().toISOString().split("T")[0],
        }),
      })
        .then((r) => r.json())
        .then((d) => d.data)
        .catch(() => null),
    enabled: !!stats,
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
                  boxShadow: `0 20px 60px color-mix(in srgb, var(--tc-primary) 25%, transparent), ${masterGlass.boxShadow}`,
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
                      "linear-gradient(90deg, transparent, var(--tc-primary), var(--tc-accent), var(--tc-primary), transparent)",
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
                            borderBottom: "var(--spatial-glass-border)",
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
                            ? "color-mix(in srgb, var(--tc-primary) 6%, transparent)"
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
                            borderBottom: "var(--spatial-glass-border)",
                          }}
                        >
                          {code}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: dark ? "#e8f4ff" : "#0a2060",
                            borderBottom: "var(--spatial-glass-border)",
                          }}
                        >
                          {data.shifts}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            borderBottom: "var(--spatial-glass-border)",
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
                    ? "color-mix(in srgb, var(--tc-primary) 15%, transparent)"
                    : "color-mix(in srgb, var(--tc-primary) 8%, transparent)",
                  border: `1px solid ${dark ? "color-mix(in srgb, var(--tc-primary) 25%, transparent)" : "color-mix(in srgb, var(--tc-primary) 20%, transparent)"}`,
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
                  boxShadow: `0 12px 40px color-mix(in srgb, var(--tc-primary) 30%, transparent), ${masterGlass.boxShadow}`,
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
                    boxShadow: `0 4px 12px color-mix(in srgb, var(--tc-primary) 30%, transparent)`,
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
