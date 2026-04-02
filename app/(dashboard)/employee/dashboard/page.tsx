"use client";
/**
 * app/(dashboard)/employee/dashboard/page.tsx
 *
 * BRIDGE: DESIGN/src/pages/EmployeeDashboard.jsx → TypeScript
 *
 * Changes:
 *  - base44 calls → useEmployeeProfile(), useEmployeeNotifications() hooks
 *  - session.getUser() removed — user info comes from server (via layout)
 *  - Optimistic mark-as-read via useMarkNotificationRead()
 *  - Pixel-perfect status cards, notification feed, and stat grid preserved
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { useEmployeeProfile, useEmployeeNotifications, useMarkNotificationRead } from "@/hooks/use-api";
import {
  CalendarDays, CheckCircle2, IndianRupee, Clock,
  Bell, ChevronRight, AlertCircle
} from "lucide-react";

export default function EmployeeDashboard() {
  const { theme: t, dark } = useTheme();
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const cardBg    = dark ? "rgba(12,10,28,0.82)" : "rgba(255,255,255,0.35)";
  const borderCol = dark ? `color-mix(in srgb, var(--tc-primary) 15%, transparent)` : `color-mix(in srgb, var(--tc-primary) 16%, transparent)`;

  const { data: profileData, isLoading } = useEmployeeProfile();
  const { data: notifData } = useEmployeeNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  const profile = profileData?.profile ?? null;
  const stats   = profileData?.stats ?? { totalShiftsDone: 0, upcomingShifts: 0, totalEarnings: 0, pendingPayment: 0, clearedPayment: 0 };
  const notifications = (notifData?.notifications as Array<{ id: string; title: string; message: string; is_read: boolean; type: string; created_at: string }> | undefined) ?? [];

  const statCards = useMemo(() => [
    { label: "Shifts Done",        value: stats.totalShiftsDone, icon: CheckCircle2, color: "var(--tc-primary)" },
    { label: "Upcoming",           value: stats.upcomingShifts,  icon: CalendarDays, color: "var(--tc-accent)" },
    { label: "Total Earned",       value: `₹${stats.totalEarnings.toLocaleString("en-IN")}`, icon: IndianRupee, color: "#34d399" },
    { label: "Pending Payment",    value: `₹${stats.pendingPayment.toLocaleString("en-IN")}`, icon: Clock, color: "#f59e0b" },
  ], [stats]);

  if (isLoading) return (
    <div className="p-8 space-y-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl skeleton" style={{ background: cardBg }} />
      ))}
    </div>
  );

  if (!profile) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle className="w-12 h-12 mb-4" style={{ color: "#f59e0b" }} />
      <h2 className="text-xl font-bold mb-2" style={{ color: textMain }}>No Profile Found</h2>
      <p className="text-sm mb-4" style={{ color: textMuted }}>You haven&apos;t registered your employee profile yet.</p>
      <Link href="/register">
        <button className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))` }}>
          Complete Registration
        </button>
      </Link>
    </div>
  );

  if (profile.status === "pending") return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Clock className="w-12 h-12 mb-4" style={{ color: "#f59e0b" }} />
      <h2 className="text-xl font-bold mb-2" style={{ color: textMain }}>Awaiting Approval</h2>
      <p className="text-sm" style={{ color: textMuted }}>Your profile is under review. You&apos;ll be notified once approved.</p>
    </div>
  );

  if (profile.status === "rejected") return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle className="w-12 h-12 mb-4" style={{ color: "#f87171" }} />
      <h2 className="text-xl font-bold mb-2" style={{ color: textMain }}>Profile Rejected</h2>
      <p className="text-sm" style={{ color: textMuted }}>
        {(profile as { rejection_reason?: string }).rejection_reason ?? "Please contact the admin for further assistance."}
      </p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textMain }}>
            Welcome, {((profile as any).full_name ?? "there").split(" ")[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: textMuted }}>Here&apos;s your activity summary</p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1.5 rounded-full capitalize"
          style={{ background: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`, color: "var(--tc-primary)", border: `1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)` }}>
          {profile.status}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="admin-panel rounded-2xl p-4"
            style={{ position: "relative" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `color-mix(in srgb, ${c.color} 13%, transparent)`, color: c.color }}>
              <c.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black" style={{ color: textMain }}>{c.value}</p>
            <p className="text-[11px] mt-1" style={{ color: textMuted }}>{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/employee/shifts">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            className="admin-panel rounded-2xl p-5 cursor-pointer flex items-center justify-between"
            style={{ position: "relative" }}>
            <div>
              <p className="font-bold text-sm" style={{ color: textMain }}>Available Shifts</p>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>Browse and book shifts</p>
            </div>
            <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "var(--tc-primary)" }} />
          </motion.div>
        </Link>
        <Link href="/employee/history">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            className="admin-panel rounded-2xl p-5 cursor-pointer flex items-center justify-between"
            style={{ position: "relative" }}>
            <div>
              <p className="font-bold text-sm" style={{ color: textMain }}>My Bookings</p>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>View shift history</p>
            </div>
            <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "var(--tc-primary)" }} />
          </motion.div>
        </Link>
      </div>

      {/* Notifications Feed */}
      <div className="admin-panel rounded-2xl overflow-hidden"
        style={{ position: "relative" }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${borderCol}` }}>
          <Bell className="w-4 h-4" style={{ color: "var(--tc-primary)" }} />
          <h2 className="font-bold" style={{ color: textMain }}>Notifications</h2>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full ml-auto"
              style={{ background: "var(--tc-secondary)", color: "#fff" }}>
              {notifications.filter(n => !n.is_read).length} new
            </span>
          )}
        </div>

        {notifications.length === 0
          ? <div className="px-5 py-10 text-center text-sm" style={{ color: textMuted }}>No notifications yet</div>
          : notifications.slice(0, 6).map((n, i) => (
              <div key={n.id}
                className="px-5 py-4 flex gap-3 cursor-pointer transition-colors"
                style={{
                  borderBottom: i < 5 ? `1px solid ${borderCol}` : "none",
                  background: n.is_read ? "transparent" : `color-mix(in srgb, var(--tc-primary) 3%, transparent)`,
                }}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `var(--tc-primary)`, color: "var(--tc-primary)" }}>
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: textMain }}>{n.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: textMuted }}>{n.message}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: "var(--tc-primary)" }} />
                )}
              </div>
            ))
        }
      </div>
    </div>
  );
}
