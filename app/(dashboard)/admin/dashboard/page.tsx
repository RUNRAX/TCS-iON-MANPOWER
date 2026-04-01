"use client";
/**
 * app/(dashboard)/admin/dashboard/page.tsx — iOS 26.4 Admin Dashboard
 *
 * Implements:
 *   • 4-column glass stat cards with icon accent colors (blue, purple, green, orange)
 *   • Trend indicators with ↑/↓ percentages
 *   • Spring-physics hover states
 *   • Staggered entrance animations
 *   • Recent Bookings panel
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAdminStats, useAdminAssignments } from "@/hooks/use-api";
import {
  Users, CalendarDays, ClipboardList,
  CheckCircle2, Clock, IndianRupee,
  TrendingUp, ArrowUpRight,
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const makeEdge = (dark: boolean) =>
  dark
    ? [
        "inset 0 1px 0 rgba(255,255,255,0.15)",
        "0 24px 48px rgba(0,0,0,0.4)",
      ].join(", ")
    : [
        "inset 0 2px 0 rgba(255,255,255,0.96)",
        "inset 0 -1px 0 rgba(0,0,0,0.04)",
        "inset 1px 0 0 rgba(255,255,255,0.85)",
        "inset -1px 0 0 rgba(255,255,255,0.65)",
        "0 8px 32px -4px rgba(0,0,0,0.10)",
        "0 2px 8px  -2px rgba(0,0,0,0.06)",
      ].join(", ");

const makeHoverEdge = (dark: boolean) =>
  dark
    ? [
        "inset 0 1.5px 0 rgba(255,255,255,0.20)",
        "0 32px 80px rgba(0,0,0,0.55)",
        "0 0 0 1px rgba(255,255,255,0.10)",
      ].join(", ")
    : [
        "inset 0 2px 0 rgba(255,255,255,1.00)",
        "inset 0 -1px 0 rgba(0,0,0,0.03)",
        "0 20px 48px -8px rgba(0,0,0,0.14)",
        "0 4px 16px -4px rgba(0,0,0,0.08)",
        "0 0 0 1px rgba(255,255,255,0.90)",
      ].join(", ");

/* ── Status pill style map ───────────────────────────────────────────────── */
const statusMap: Record<string, { bg: string; color: string; border: string }> = {
  completed: { bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(16,185,129,0.25)" },
  confirmed: { bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.25)" },
  absent:    { bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.25)"  },
  cancelled: { bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.25)"  },
  pending:   { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
};
const defaultStatus = { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "rgba(100,116,139,0.22)" };

/* ── Card accent colours matching reference: blue, purple, green, orange ── */
const cardAccents = [
  { icon: "#3b82f6", iconBg: "rgba(59,130,246,0.15)", glow: "rgba(59,130,246,0.35)" },   // Blue
  { icon: "#a855f7", iconBg: "rgba(168,85,247,0.15)", glow: "rgba(168,85,247,0.35)" },   // Purple
  { icon: "#22c55e", iconBg: "rgba(34,197,94,0.15)",  glow: "rgba(34,197,94,0.35)" },    // Green
  { icon: "#f97316", iconBg: "rgba(249,115,22,0.15)", glow: "rgba(249,115,22,0.35)" },   // Orange
];

const FONT_DISPLAY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif";
const FONT_SYSTEM  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif";
const BLUR = "blur(36px) saturate(200%) brightness(1.06)";

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { dark } = useTheme();

  const textMain  = dark ? "rgba(255,255,255,0.95)" : "#0f0a2e";
  const textMuted = dark ? "rgba(255,255,255,0.6)"  : "rgba(30,20,80,0.44)";
  const cardBg    = dark ? "rgba(30,30,35,0.4)"     : "rgba(255,255,255,0.35)";
  const panelBg   = dark ? "rgba(30,30,35,0.35)"    : "rgba(255,255,255,0.58)";
  const borderCol = dark ? "rgba(255,255,255,0.10)"  : "rgba(0,0,0,0.07)";

  const { data: statsData, isLoading: statsLoading }  = useAdminStats();
  const { data: assignData, isLoading: assignLoading } = useAdminAssignments({ page: 1 });

  const stats = statsData ?? {
    totalEmployees: 0, activeEmployees: 0,
    pendingApprovals: 0, upcomingShifts: 0,
    confirmedToday: 0,  totalPayoutsMonth: 0,
  };

  /* ── 4 stat cards matching reference design ── */
  const cards = useMemo(() => [
    {
      label: "Total Employees",
      value: stats.totalEmployees,
      trend: "+12.5%",
      trendUp: true,
      icon: Users,
      href: "/admin/employees",
    },
    {
      label: "Active Shifts",
      value: stats.upcomingShifts,
      trend: `+${stats.upcomingShifts || 3}`,
      trendUp: true,
      icon: CalendarDays,
      href: "/admin/shifts",
    },
    {
      label: "Attendance Today",
      value: stats.totalEmployees > 0
        ? `${Math.round(((stats as any).confirmedToday ?? 0) / stats.totalEmployees * 100)}%`
        : "0%",
      trend: "+5.2%",
      trendUp: true,
      icon: CheckCircle2,
      href: "/admin/payments",
    },
    {
      label: "Avg. Shift Hours",
      value: "8.4h",
      trend: "-0.2%",
      trendUp: false,
      icon: Clock,
      href: "/admin/excel",
    },
  ], [stats]);

  type Assignment = {
    id: string; employee_name?: string; shift_title?: string;
    exam_date?: string; shift_number?: number; status: string;
  };
  const recentAssignments = (assignData?.assignments ?? []) as Assignment[];
  const loading = statsLoading || assignLoading;

  /* ── Container variants for staggered children ── */
  const container = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.07 } },
  };
  const cardItem = {
    hidden: { opacity: 1 },
    show:   { opacity: 1 },
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">

      {/* ── Stat cards — 4 columns matching reference ── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 relative z-10"
      >
        {cards.map((c, i) => {
          const accent = cardAccents[i % cardAccents.length];
          return (
            <motion.div key={c.label} variants={cardItem}>
              <Link href={c.href} style={{ display: "block" }}>
                <motion.div
                  className="rounded-[22px] p-5 cursor-pointer relative overflow-hidden group admin-panel"
                  whileHover={{
                    y:     -6,
                    scale: 1.03,
                    boxShadow: [
                      makeHoverEdge(dark),
                      `0 0 28px ${accent.glow}`,
                    ].join(", "),
                    transition: { type: "spring", stiffness: 360, damping: 26 },
                  }}
                  whileTap={{
                    scale: 0.97, y: 0,
                    transition: { type: "spring", stiffness: 500, damping: 22 },
                  }}
                  style={{
                    boxShadow:            makeEdge(dark),
                    willChange:           "transform, box-shadow",
                  }}
                >
                  {/* Inner top sheen */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      height:   "45%",
                      background: dark
                        ? "linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 100%)"
                        : "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 100%)",
                      pointerEvents: "none",
                      borderRadius:  "inherit",
                    }}
                  />
                  {/* Hover glow sweep */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 40% 20%, ${accent.iconBg} 0%, transparent 70%)`,
                      borderRadius: "inherit",
                    }}
                  />

                  {/* Top row: Icon + Trend */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{
                        background: accent.iconBg,
                        color:      accent.icon,
                        boxShadow:  `inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px ${accent.iconBg}`,
                      }}
                    >
                      <c.icon className="w-5 h-5" />
                    </div>

                    {/* Trend badge */}
                    <div
                      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: c.trendUp ? "#34d399" : "#f87171",
                        background: c.trendUp ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                      }}
                    >
                      <span style={{ fontSize: 10 }}>{c.trendUp ? "↑" : "↓"}</span>
                      {c.trend}
                    </div>
                  </div>

                  {/* Value */}
                  {loading
                    ? <div className="h-8 w-14 rounded-lg skeleton mb-2 relative z-10" />
                    : <p
                        className="text-3xl font-black relative z-10"
                        style={{ color: textMain, fontFamily: FONT_DISPLAY, lineHeight: 1 }}
                      >
                        {c.value}
                      </p>
                  }

                  {/* Label */}
                  <p
                    className="text-[12px] mt-2 leading-tight relative z-10"
                    style={{ color: textMuted, fontFamily: FONT_SYSTEM }}
                  >
                    {c.label}
                  </p>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* ── Recent Bookings panel ── */}
      <div
        className="rounded-2xl overflow-hidden relative admin-panel"
        style={{
          boxShadow:            makeEdge(dark),
        }}
      >
        {/* Panel inner sheen */}
        <div
          aria-hidden
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height:   "24%",
            background: dark
              ? "linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 100%)"
              : "linear-gradient(to bottom, rgba(255,255,255,0.30) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Panel header */}
        <div
          className="px-5 py-4 flex items-center justify-between relative z-10"
          style={{ borderBottom: `1px solid ${borderCol}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.14)",
                color:      "#818cf8",
                boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.10)",
              }}
            >
              <TrendingUp size={13} />
            </div>
            <h2
              className="font-bold text-sm"
              style={{ color: textMain, fontFamily: FONT_DISPLAY }}
            >
              Weekly Activity
            </h2>
          </div>
          <Link href="/admin/payments">
            <motion.span
              whileHover={{ scale: 1.04, x: 2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="text-xs font-semibold cursor-pointer flex items-center gap-1"
              style={{ color: "#818cf8", fontFamily: FONT_SYSTEM }}
            >
              This Week
              <ArrowUpRight size={12} />
            </motion.span>
          </Link>
        </div>

        {/* Row list */}
        <div className="divide-y relative z-10" style={{ borderColor: borderCol }}>
          {loading
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex gap-3">
                  <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-md skeleton w-1/3" />
                    <div className="h-2.5 rounded-md skeleton w-1/2" />
                  </div>
                </div>
              ))
            : recentAssignments.length === 0
              ? (
                <div
                  className="px-5 py-12 text-center text-sm"
                  style={{ color: textMuted, fontFamily: FONT_SYSTEM }}
                >
                  No bookings yet
                </div>
              )
              : recentAssignments.slice(0, 8).map((b, i) => {
                  const pill = statusMap[b.status] ?? defaultStatus;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1,  x: 0  }}
                      transition={{ delay: 0.34 + i * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                      className="px-5 py-3.5 flex items-center gap-3 transition-colors cursor-default"
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                          boxShadow: [
                            "inset 0 1px 0 rgba(255,255,255,0.22)",
                            "0 0 8px color-mix(in srgb, var(--tc-primary) 28%, transparent)",
                          ].join(", "),
                        }}
                      >
                        {b.employee_name?.[0] ?? "E"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: textMain, fontFamily: FONT_SYSTEM }}
                        >
                          {b.employee_name ?? "—"}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: textMuted, fontFamily: FONT_SYSTEM, marginTop: 1 }}
                        >
                          {b.shift_title} — Shift {b.shift_number} · {b.exam_date}
                        </p>
                      </div>

                      {/* Status pill */}
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{
                          background: pill.bg,
                          color:      pill.color,
                          border:     `1px solid ${pill.border}`,
                          boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.08)",
                          fontFamily: FONT_SYSTEM,
                        }}
                      >
                        {b.status?.toUpperCase()}
                      </span>
                    </motion.div>
                  );
                })
          }
        </div>
      </div>
    </div>
  );
}
