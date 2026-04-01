"use client";
/**
 * app/(dashboard)/admin/dashboard/page.tsx — iOS 26.4 Admin Dashboard
 *
 * Implements:
 *   • 3-layer glass stat cards with mouse-parallax tilt + glow border
 *   • Spring-physics hover states (scale, y-levitation, box-shadow bloom)
 *   • Staggered entrance animations
 *   • Apple typography hierarchy with SF Pro / Outfit
 *   • 8pt grid spacing throughout
 */

"use client";

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
import { GlassCard, GlassBadge, GlassDivider } from "@/components/ui/glass3d";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const makeEdge = (dark: boolean) =>
  dark
    ? [
        "inset 0 1.5px 0 rgba(255,255,255,0.16)",
        "inset 0 -1px 0 rgba(0,0,0,0.16)",
        "inset 1px 0 0 rgba(255,255,255,0.08)",
        "inset -1px 0 0 rgba(255,255,255,0.04)",
        "0 12px 40px -8px rgba(0,0,0,0.40)",
        "0 4px 12px -4px rgba(0,0,0,0.20)",
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
        "inset 0 2px 0 rgba(255,255,255,0.20)",
        "inset 0 -1px 0 rgba(0,0,0,0.18)",
        "0 28px 72px -8px rgba(0,0,0,0.55)",
        "0 8px 24px -4px rgba(0,0,0,0.30)",
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

/* ── Card accent colours ─────────────────────────────────────────────────── */
const cardAccents = [
  { icon: "#818cf8", bg: "rgba(99,102,241,0.12)",  glow: "rgba(99,102,241,0.40)"  },
  { icon: "#fbbf24", bg: "rgba(245,158,11,0.12)",  glow: "rgba(245,158,11,0.35)"  },
  { icon: "#34d399", bg: "rgba(16,185,129,0.12)",  glow: "rgba(16,185,129,0.35)"  },
  { icon: "#38bdf8", bg: "rgba(6,182,212,0.12)",   glow: "rgba(6,182,212,0.35)"   },
  { icon: "#a78bfa", bg: "rgba(139,92,246,0.12)",  glow: "rgba(139,92,246,0.35)"  },
  { icon: "#4ade80", bg: "rgba(74,222,128,0.12)",  glow: "rgba(74,222,128,0.30)"  },
];

const FONT_DISPLAY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif";
const FONT_SYSTEM  = "-apple-system, BlinkMacSystemFont, 'SF Pro Text',    'Outfit', sans-serif";
const BLUR = "blur(36px) saturate(200%) brightness(1.06)";

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { dark } = useTheme();

  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.50)" : "rgba(30,20,80,0.44)";
  const cardBg    = dark ? "rgba(10,8,24,0.50)"     : "rgba(255,255,255,0.62)";
  const panelBg   = dark ? "rgba(10,8,24,0.46)"     : "rgba(255,255,255,0.58)";
  const borderCol = dark ? "rgba(255,255,255,0.10)"  : "rgba(0,0,0,0.07)";

  const { data: statsData, isLoading: statsLoading }  = useAdminStats();
  const { data: assignData, isLoading: assignLoading } = useAdminAssignments({ page: 1 });

  const stats = statsData ?? {
    totalEmployees: 0, activeEmployees: 0,
    pendingApprovals: 0, upcomingShifts: 0,
    confirmedToday: 0,  totalPayoutsMonth: 0,
  };

  const cards = useMemo(() => [
    { label: "Active Employees",  value: stats.activeEmployees,  icon: Users,         href: "/admin/employees" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: Clock,         href: "/admin/employees", urgent: (stats.pendingApprovals ?? 0) > 0 },
    { label: "Upcoming Shifts",   value: stats.upcomingShifts,   icon: CalendarDays,  href: "/admin/shifts"    },
    { label: "Confirmed Today",   value: (stats as any).confirmedToday ?? 0, icon: CheckCircle2, href: "/admin/payments" },
    { label: "Total Employees",   value: stats.totalEmployees,   icon: ClipboardList, href: "/admin/employees" },
    {
      label: "Paid Out (Month)",
      value: `₹${(((stats as any).totalPayoutsMonth ?? 0) / 100).toLocaleString("en-IN")}`,
      icon: IndianRupee, href: "/admin/excel",
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
    show:   { transition: { staggerChildren: 0.055 } },
  };
  const cardItem = {
    hidden: { opacity: 0, y: 22, scale: 0.97 },
    show:   { opacity: 1, y: 0,  scale: 1.00, transition: { type: "spring", stiffness: 320, damping: 28 } },
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1,  y: 0  }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: textMain, fontFamily: FONT_DISPLAY, fontWeight: 800 }}
            >
              Admin Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: textMuted, fontFamily: FONT_SYSTEM }}>
              Overview of all staff and shifts for TCS iON exams
            </p>
          </div>

          {/* Live indicator */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(16,185,129,0.12)",
              border:     "1px solid rgba(16,185,129,0.25)",
              color:      "#34d399",
              fontFamily: FONT_SYSTEM,
              boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 6px #10b98199",
                animation: "pulse 2.4s ease-in-out infinite",
              }}
            />
            Live
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        style={{ perspective: "1200px" }}
      >
        {cards.map((c, i) => {
          const accent = cardAccents[i % cardAccents.length];
          return (
            <motion.div key={c.label} variants={cardItem}>
              <Link href={c.href} style={{ display: "block" }}>
                <motion.div
                  className="rounded-2xl p-4 cursor-pointer relative overflow-hidden group"
                  whileHover={{
                    y:     -8,
                    scale: 1.04,
                    boxShadow: [
                      makeHoverEdge(dark),
                      `0 0 32px ${accent.glow}`,
                    ].join(", "),
                    transition: { type: "spring", stiffness: 360, damping: 26 },
                  }}
                  whileTap={{
                    scale: 0.96, y: 0,
                    transition: { type: "spring", stiffness: 500, damping: 22 },
                  }}
                  style={{
                    background:           cardBg,
                    backdropFilter:       BLUR,
                    WebkitBackdropFilter: BLUR,
                    border:               `1px solid ${c.urgent ? "rgba(245,158,11,0.45)" : borderCol}`,
                    boxShadow:            makeEdge(dark),
                    transformStyle:       "preserve-3d",
                    willChange:           "transform, box-shadow",
                  }}
                >
                  {/* Inner top sheen */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      height:   "40%",
                      background: dark
                        ? "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)"
                        : "linear-gradient(to bottom, rgba(255,255,255,0.75) 0%, transparent 100%)",
                      pointerEvents: "none",
                      borderRadius:  "inherit",
                    }}
                  />
                  {/* Hover glow sweep */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 40% 20%, ${accent.bg} 0%, transparent 70%)`,
                      borderRadius: "inherit",
                    }}
                  />
                  {/* Trend arrow */}
                  <div
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-60 transition-opacity duration-200"
                    style={{ color: accent.icon }}
                  >
                    <ArrowUpRight size={13} />
                  </div>

                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 relative z-10"
                    style={{
                      background: accent.bg,
                      color:      accent.icon,
                      boxShadow:  `inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px ${accent.bg}`,
                    }}
                  >
                    <c.icon className="w-4 h-4" />
                  </div>

                  {/* Value */}
                  {loading
                    ? <div className="h-7 w-12 rounded-lg skeleton mb-1 relative z-10" />
                    : <p
                        className="text-2xl font-black relative z-10"
                        style={{ color: textMain, fontFamily: FONT_DISPLAY, lineHeight: 1 }}
                      >
                        {c.value}
                      </p>
                  }

                  {/* Label */}
                  <p
                    className="text-[11px] mt-1.5 leading-tight relative z-10"
                    style={{ color: textMuted, fontFamily: FONT_SYSTEM }}
                  >
                    {c.label}
                  </p>

                  {/* Urgent badge */}
                  {c.urgent && (
                    <span
                      className="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full relative z-10"
                      style={{
                        background: "rgba(245,158,11,0.14)",
                        color:      "#f59e0b",
                        border:     "1px solid rgba(245,158,11,0.30)",
                        boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      Action needed
                    </span>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Recent Bookings panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1,  y: 0  }}
        transition={{ delay: 0.28, duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl overflow-hidden relative"
        style={{
          background:           panelBg,
          border:               `1px solid ${borderCol}`,
          backdropFilter:       BLUR,
          WebkitBackdropFilter: BLUR,
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
              : "linear-gradient(to bottom, rgba(255,255,255,0.78) 0%, transparent 100%)",
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
              Recent Bookings
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
              View all
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
      </motion.div>
    </div>
  );
}
