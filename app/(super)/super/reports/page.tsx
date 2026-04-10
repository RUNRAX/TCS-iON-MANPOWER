"use client";
/**
 * app/(super)/super/reports/page.tsx — Cross-Center Analytics & Reports
 *
 * Aggregated view of platform-wide metrics:
 * center-wise employee distribution, shift volume, payment clearance.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  BarChart3,
  Users,
  CalendarDays,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

/* ── Animations ───────────────────────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
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

export default function SuperReportsPage() {
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "centers" | "shifts">("overview");

  const dimText = dark ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.55)";

  const masterGlass = {
    background: "var(--spatial-glass-bg)",
    backdropFilter: "var(--spatial-glass-blur)",
    WebkitBackdropFilter: "var(--spatial-glass-blur)",
    border: "var(--spatial-glass-border)",
    boxShadow: "var(--spatial-glass-shadow)",
    borderRadius: 24,
  };

  // ── Fetch stats for reports
  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ["super", "stats"],
    queryFn: () =>
      fetch("/api/super/stats")
        .then((r) => r.json())
        .then((d) => d.data),
    staleTime: 30_000,
  });

  // ── Fetch admins for center-level breakdown
  const { data: adminsData } = useQuery({
    queryKey: ["super", "admins"],
    queryFn: () =>
      fetch("/api/super/admins")
        .then((r) => r.json())
        .then((d) => d.data),
    staleTime: 60_000,
  });

  const stats = statsData ?? {};
  const admins: any[] = adminsData?.admins ?? [];

  // Build center-level breakdown
  const centerMap = new Map<string, { adminCount: number; active: number; inactive: number }>();
  for (const admin of admins) {
    const code = admin.centerCode ?? "UNKNOWN";
    const existing = centerMap.get(code) ?? { adminCount: 0, active: 0, inactive: 0 };
    existing.adminCount++;
    if (admin.isActive) existing.active++;
    else existing.inactive++;
    centerMap.set(code, existing);
  }
  const centers = Array.from(centerMap.entries()).sort((a, b) => b[1].adminCount - a[1].adminCount);

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: BarChart3 },
    { key: "centers" as const, label: "Centers", icon: Building2 },
    { key: "shifts" as const, label: "Shifts", icon: CalendarDays },
  ];

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
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* ── Header ── */}
        <motion.div variants={item} style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              REPORTS & ANALYTICS
            </h1>
            <p style={{ fontSize: 12, color: dimText, marginTop: 4, fontFamily: "var(--font-jetbrains-mono)" }}>
              Cross-center performance metrics & platform analytics
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => refetch()}
            style={{
              background: "transparent",
              border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)`,
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              color: dimText,
            }}
          >
            <RefreshCw size={16} />
          </motion.button>
        </motion.div>

        {/* ── Tab bar ── */}
        <motion.div variants={item} style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "var(--font-jetbrains-mono)",
                  border: isActive
                    ? `1px solid color-mix(in srgb, var(--tc-primary) 40%, transparent)`
                    : `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  background: isActive
                    ? `linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 80%, transparent), color-mix(in srgb, var(--tc-secondary) 70%, transparent))`
                    : dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  color: isActive ? "#fff" : dimText,
                  boxShadow: isActive
                    ? `0 4px 16px color-mix(in srgb, var(--tc-primary) 25%, transparent)`
                    : "none",
                  transition: "all 0.22s ease",
                }}
              >
                <Icon size={14} />
                {tab.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <>
            {/* KPI cards */}
            <motion.div variants={item} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "TOTAL ADMINS", value: stats.totalAdmins ?? "—", icon: Users, trend: null },
                { label: "TOTAL EMPLOYEES", value: stats.totalEmployees ?? "—", icon: Users, trend: stats.employeeGrowth },
                { label: "ACTIVE EMPLOYEES", value: stats.activeEmployees ?? "—", icon: TrendingUp, trend: null },
                { label: "PUBLISHED SHIFTS", value: stats.publishedShifts ?? "—", icon: CalendarDays, trend: null },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={i}
                    style={{
                      ...masterGlass,
                      padding: "20px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: 2,
                        textTransform: "uppercase", color: dimText,
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}>
                        {kpi.label}
                      </p>
                      <Icon size={14} color="var(--tc-primary)" />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{
                        fontSize: 28, fontWeight: 800, color: dark ? "#fff" : "var(--tc-primary)",
                        fontFamily: "var(--font-jetbrains-mono)", lineHeight: 1,
                      }}>
                        {kpi.value}
                      </span>
                      {kpi.trend != null && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: 2,
                          fontSize: 11, fontWeight: 600,
                          color: Number(kpi.trend) >= 0 ? "#22c55e" : "#ef4444",
                        }}>
                          {Number(kpi.trend) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {Math.abs(Number(kpi.trend))}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <motion.div variants={item} style={{ ...masterGlass, padding: "24px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Building2 size={16} color="var(--tc-accent)" />
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                    color: dark ? "#fff" : "var(--tc-primary)",
                    fontFamily: "var(--font-jetbrains-mono)",
                  }}>ACTIVE CENTERS</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {centers.length === 0 ? (
                    <p style={{ fontSize: 13, color: dimText }}>No centers found.</p>
                  ) : (
                    centers.map(([code, data]) => (
                      <div key={code} style={{
                        padding: "6px 14px", borderRadius: 8,
                        background: `color-mix(in srgb, var(--tc-primary) 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)`,
                        fontSize: 12, fontWeight: 700, color: "var(--tc-accent)",
                        fontFamily: "var(--font-jetbrains-mono)", letterSpacing: 2,
                      }}>
                        {code}
                        <span style={{ fontSize: 10, color: dimText, marginLeft: 8 }}>
                          {data.adminCount} admin{data.adminCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              <motion.div variants={item} style={{ ...masterGlass, padding: "24px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <FileSpreadsheet size={16} color="var(--tc-accent)" />
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                    color: dark ? "#fff" : "var(--tc-primary)",
                    fontFamily: "var(--font-jetbrains-mono)",
                  }}>PLATFORM HEALTH</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Total Centers", value: centers.length },
                    { label: "Active Admins", value: admins.filter(a => a.isActive).length },
                    { label: "Inactive Admins", value: admins.filter(a => !a.isActive).length },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 10,
                      background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    }}>
                      <span style={{ fontSize: 12, color: dimText }}>{row.label}</span>
                      <span style={{
                        fontSize: 14, fontWeight: 700, color: "var(--tc-accent)",
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* ── Centers Tab ── */}
        {activeTab === "centers" && (
          <motion.div variants={item} style={{ ...masterGlass, padding: "24px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Building2 size={16} color="var(--tc-accent)" />
              <p style={{
                fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                color: dark ? "#fff" : "var(--tc-primary)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}>CENTER-WISE BREAKDOWN</p>
            </div>

            {centers.length === 0 ? (
              <p style={{ fontSize: 13, color: dimText }}>No center data available yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Table header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  padding: "10px 16px", borderRadius: 10,
                  background: `color-mix(in srgb, var(--tc-primary) 8%, transparent)`,
                }}>
                  {["CENTER CODE", "ADMINS", "ACTIVE", "INACTIVE"].map((h) => (
                    <span key={h} style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 2, color: dimText,
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}>{h}</span>
                  ))}
                </div>

                {/* Table rows */}
                {centers.map(([code, data]) => (
                  <div key={code} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    padding: "12px 16px", borderRadius: 10,
                    background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                    border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    transition: "background 0.15s ease",
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: "var(--tc-accent)",
                      fontFamily: "var(--font-jetbrains-mono)", letterSpacing: 2,
                    }}>{code}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: dark ? "#fff" : "var(--tc-primary)" }}>
                      {data.adminCount}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>{data.active}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: data.inactive > 0 ? "#ef4444" : dimText }}>
                      {data.inactive}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Shifts Tab ── */}
        {activeTab === "shifts" && (
          <motion.div variants={item} style={{ ...masterGlass, padding: "24px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <CalendarDays size={16} color="var(--tc-accent)" />
              <p style={{
                fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                color: dark ? "#fff" : "var(--tc-primary)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}>SHIFT ANALYTICS</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { label: "Published Shifts", value: stats.publishedShifts ?? "—", color: "var(--tc-primary)" },
                { label: "Total Employees", value: stats.totalEmployees ?? "—", color: "var(--tc-secondary)" },
                { label: "Active Employees", value: stats.activeEmployees ?? "—", color: "var(--tc-accent)" },
              ].map((card, i) => (
                <div key={i} style={{
                  padding: "20px 18px", borderRadius: 16,
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                  textAlign: "center",
                }}>
                  <p style={{
                    fontSize: 32, fontWeight: 800, color: card.color,
                    fontFamily: "var(--font-jetbrains-mono)", lineHeight: 1.1,
                  }}>{card.value}</p>
                  <p style={{
                    fontSize: 10, fontWeight: 600, color: dimText, marginTop: 8,
                    letterSpacing: 1.5, textTransform: "uppercase",
                    fontFamily: "var(--font-jetbrains-mono)",
                  }}>{card.label}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: dimText, marginTop: 18, fontStyle: "italic" }}>
              Detailed shift analytics with time-series data will be available in a future update.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
