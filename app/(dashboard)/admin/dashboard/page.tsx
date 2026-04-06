"use client";
/**
 * app/(dashboard)/admin/dashboard/page.tsx — iOS 26.4 Admin Dashboard
 *
 * Implements:
 *   • 4-column glass stat cards with icon accent colors (blue, purple, green, orange)
 *   • Trend indicators with ↑/↓ percentages
 *   • Spring-physics hover states
 *   • Monthly Shifts panel — 1-month window from April 20
 *   • Mark Complete button on each shift row
 */

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAdminStats, useAdminShifts, usePatchShift } from "@/hooks/use-api";
import {
  Users, CalendarDays, CheckCircle2, Clock,
  TrendingUp, ArrowUpRight, MapPin, CheckCircle,
  Calendar, Loader2,
} from "lucide-react";
import { toast } from "sonner";

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
const statusMap: Record<string, { bg: string; color: string; border: string; label: string }> = {
  completed:  { bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(16,185,129,0.25)", label: "COMPLETED" },
  published:  { bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.25)", label: "PUBLISHED" },
  draft:      { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)", label: "DRAFT" },
  cancelled:  { bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.25)",  label: "CANCELLED" },
};
const defaultStatus = { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "rgba(100,116,139,0.22)", label: "UNKNOWN" };

/* ── Card accent colours matching reference: blue, purple, green, orange ── */
const cardAccents = [
  { icon: "#3b82f6", iconBg: "rgba(59,130,246,0.15)", glow: "rgba(59,130,246,0.35)" },
  { icon: "#a855f7", iconBg: "rgba(168,85,247,0.15)", glow: "rgba(168,85,247,0.35)" },
  { icon: "#22c55e", iconBg: "rgba(34,197,94,0.15)",  glow: "rgba(34,197,94,0.35)" },
  { icon: "#f97316", iconBg: "rgba(249,115,22,0.15)", glow: "rgba(249,115,22,0.35)" },
];

const FONT_DISPLAY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif";
const FONT_SYSTEM  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif";

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { dark } = useTheme();

  const textMain  = dark ? "rgba(255,255,255,0.95)" : "#0f0a2e";
  const textMuted = dark ? "rgba(255,255,255,0.6)"  : "rgba(30,20,80,0.44)";
  const borderCol = dark ? "rgba(255,255,255,0.10)"  : "rgba(0,0,0,0.07)";

  const { data: statsData, isLoading: statsLoading } = useAdminStats();
  const { data: shiftsData, isLoading: shiftsLoading } = useAdminShifts({ page: 1, limit: 50 });
  const patchShift = usePatchShift();

  const [completingId, setCompletingId] = useState<string | null>(null);

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

  /* ── Filter shifts for 1-month window starting April 20 ── */
  const monthlyShifts = useMemo(() => {
    if (!shiftsData?.shifts) return [];
    const windowStart = new Date("2026-04-20");
    const windowEnd = new Date("2026-05-20");
    
    return shiftsData.shifts
      .filter((s: any) => {
        const d = new Date(s.exam_date);
        return d >= windowStart && d <= windowEnd && s.status !== "cancelled";
      })
      .sort((a: any, b: any) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
  }, [shiftsData]);

  const upcomingShifts = monthlyShifts.filter((s: any) => s.status === "published" || s.status === "draft");
  const completedShifts = monthlyShifts.filter((s: any) => s.status === "completed");

  const loading = statsLoading || shiftsLoading;

  /* ── Handle mark complete ── */
  const handleMarkComplete = async (shiftId: string) => {
    setCompletingId(shiftId);
    patchShift.mutate(
      { shiftId, action: "complete" },
      {
        onSuccess: () => {
          toast.success("Shift marked as completed ✓");
          setCompletingId(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to complete shift");
          setCompletingId(null);
        },
      }
    );
  };

  /* ── Card animations ── */
  const cardItem = {
    hidden: { opacity: 1 },
    show:   { opacity: 1 },
  };

  /* ── Format date helpers ── */
  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" });
  };
  const fmtTime = (t: string) => t?.slice(0, 5) ?? "—";

  /* ── Is shift date in the past? ── */
  const isPast = (d: string) => new Date(d) < new Date(new Date().toDateString());

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">

      {/* ── Stat cards — 4 columns matching reference ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 relative z-10">
        {cards.map((c, i) => {
          const accent = cardAccents[i % cardAccents.length];
          return (
            <motion.div key={c.label} variants={cardItem}>
              <Link href={c.href} style={{ display: "block" }}>
                <motion.div
                  className="rounded-[22px] p-5 cursor-pointer relative overflow-hidden group admin-panel"
                  whileHover={{
                    y: -6,
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
                    boxShadow: makeEdge(dark),
                    willChange: "transform, box-shadow",
                  }}
                >
                  {/* Hover glow sweep */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
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
                        color: accent.icon,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px ${accent.iconBg}`,
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

      {/* ── Monthly Shifts panel ── */}
      <div
        className="rounded-2xl overflow-hidden relative admin-panel"
        style={{ boxShadow: makeEdge(dark) }}
      >
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
                color: "#818cf8",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
              }}
            >
              <Calendar size={13} />
            </div>
            <h2
              className="font-bold text-sm"
              style={{ color: textMain, fontFamily: FONT_DISPLAY }}
            >
              Monthly Activity
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
              background: "rgba(99,102,241,0.10)",
              color: "#818cf8",
            }}>
              Apr 20 — May 20
            </span>
            <Link href="/admin/shifts">
              <motion.span
                whileHover={{ scale: 1.04, x: 2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                className="text-xs font-semibold cursor-pointer flex items-center gap-1"
                style={{ color: "#818cf8", fontFamily: FONT_SYSTEM }}
              >
                All Shifts
                <ArrowUpRight size={12} />
              </motion.span>
            </Link>
          </div>
        </div>

        {/* Shift sections */}
        <div className="relative z-10">
          {loading ? (
            /* Skeleton */
            <div className="divide-y" style={{ borderColor: borderCol }}>
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-md skeleton w-1/3" />
                    <div className="h-2.5 rounded-md skeleton w-1/2" />
                  </div>
                  <div className="w-16 h-6 rounded-full skeleton" />
                </div>
              ))}
            </div>
          ) : monthlyShifts.length === 0 ? (
            <div
              className="px-5 py-16 text-center"
              style={{ color: textMuted, fontFamily: FONT_SYSTEM }}
            >
              <Calendar size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p className="text-sm font-medium" style={{ marginBottom: 4 }}>No shifts in this window</p>
              <p className="text-xs" style={{ opacity: 0.7 }}>Create shifts for the Apr 20 – May 20 period</p>
            </div>
          ) : (
            <>
              {/* Upcoming Shifts Section */}
              {upcomingShifts.length > 0 && (
                <div>
                  <div className="px-5 py-2.5" style={{ background: dark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.04)" }}>
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#818cf8" }}>
                      Upcoming ({upcomingShifts.length})
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: borderCol }}>
                    {upcomingShifts.map((s: any, i: number) => {
                      const pill = statusMap[s.status] ?? defaultStatus;
                      const past = isPast(s.exam_date);
                      const completing = completingId === s.id;
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="px-5 py-3 flex items-center gap-3"
                          style={{ transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Date pill */}
                          <div className="flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center" style={{
                            background: dark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                            border: `1px solid rgba(99,102,241,0.18)`,
                          }}>
                            <span className="text-[10px] font-bold leading-none" style={{ color: "#818cf8" }}>
                              {new Date(s.exam_date).getDate()}
                            </span>
                            <span className="text-[8px] font-semibold uppercase" style={{ color: "#818cf8", opacity: 0.7 }}>
                              {new Date(s.exam_date).toLocaleDateString("en", { month: "short" })}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: textMain, fontFamily: FONT_SYSTEM }}>
                              {s.title} — Shift {s.shift_number}
                            </p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap" style={{ fontSize: 11, color: textMuted, fontFamily: FONT_SYSTEM }}>
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={10} /> {s.venue}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={10} /> {s.confirmed_count}/{s.max_employees}
                              </span>
                            </div>
                          </div>

                          {/* Status + Mark Complete */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                              style={{
                                background: pill.bg, color: pill.color,
                                border: `1px solid ${pill.border}`,
                                fontFamily: FONT_SYSTEM,
                              }}
                            >
                              {pill.label}
                            </span>

                            {/* Show Mark Complete for published shifts whose date has passed */}
                            {s.status === "published" && past && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                onClick={() => handleMarkComplete(s.id)}
                                disabled={completing}
                                style={{
                                  padding: "5px 10px", borderRadius: 10,
                                  background: "rgba(16,185,129,0.12)",
                                  border: "1px solid rgba(16,185,129,0.25)",
                                  color: "#34d399", fontSize: 10, fontWeight: 700,
                                  cursor: completing ? "not-allowed" : "pointer",
                                  display: "flex", alignItems: "center", gap: 4,
                                  opacity: completing ? 0.6 : 1,
                                  fontFamily: FONT_SYSTEM,
                                  transition: "opacity 0.15s, background 0.15s",
                                }}
                                onMouseEnter={e => { if (!completing) e.currentTarget.style.background = "rgba(16,185,129,0.20)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.12)"; }}
                              >
                                {completing ? (
                                  <Loader2 size={10} style={{ animation: "spin 0.7s linear infinite" }} />
                                ) : (
                                  <CheckCircle size={10} />
                                )}
                                {completing ? "..." : "Complete"}
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Shifts Section */}
              {completedShifts.length > 0 && (
                <div>
                  <div className="px-5 py-2.5" style={{ background: dark ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.04)" }}>
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#34d399" }}>
                      Completed ({completedShifts.length})
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: borderCol }}>
                    {completedShifts.map((s: any, i: number) => {
                      const pill = statusMap.completed;
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="px-5 py-3 flex items-center gap-3"
                          style={{ transition: "background 0.15s", opacity: 0.75 }}
                          onMouseEnter={e => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)"; e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = "0.75"; }}
                        >
                          {/* Date pill */}
                          <div className="flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center" style={{
                            background: dark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.06)",
                            border: `1px solid rgba(16,185,129,0.16)`,
                          }}>
                            <span className="text-[10px] font-bold leading-none" style={{ color: "#34d399" }}>
                              {new Date(s.exam_date).getDate()}
                            </span>
                            <span className="text-[8px] font-semibold uppercase" style={{ color: "#34d399", opacity: 0.7 }}>
                              {new Date(s.exam_date).toLocaleDateString("en", { month: "short" })}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: textMain, fontFamily: FONT_SYSTEM }}>
                              {s.title} — Shift {s.shift_number}
                            </p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap" style={{ fontSize: 11, color: textMuted, fontFamily: FONT_SYSTEM }}>
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={10} /> {s.venue}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={10} /> {s.confirmed_count}/{s.max_employees}
                              </span>
                            </div>
                          </div>

                          {/* Status pill */}
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{
                              background: pill.bg, color: pill.color,
                              border: `1px solid ${pill.border}`,
                              fontFamily: FONT_SYSTEM,
                            }}
                          >
                            ✓ {pill.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
