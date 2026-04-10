"use client";
/**
 * app/(super)/super/activity/page.tsx — Admin Activity Monitor
 *
 * "Live Log Terminal" — color-coded audit log feed with expandable
 * raw JSON for each entry. Filters by action type, pagination.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
} from "lucide-react";

/* ── Master palette ───────────────────────────────────────────────────────── */
const MASTER_PALETTE = {
  primary: "#1a6fff",
  secondary: "#0a3fa8",
  accent: "#67e8f9",
};

/* ── Action colour mapping ─────────────────────────────────────────────────── */
const actionColor: Record<string, string> = {
  "employee.create": "#22c55e",
  "employee.approve": "#22c55e",
  "employee.reject": "#ef4444",
  "super_admin.create_admin": "#3b82f6",
  "super_admin.deactivate_admin": "#ef4444",
  "super_admin.activate_admin": "#22c55e",
  "super_admin.force_password_reset": "#f59e0b",
  "super_admin.update_center": "#f59e0b",
  "super_admin.system_broadcast": "#8b5cf6",
  "payment.clear": "#10b981",
  "shift.publish": "#6366f1",
  "shift.create": "#22c55e",
  "shift.update": "#f59e0b",
  "shift.delete": "#ef4444",
};

function getActionColor(action: string): string {
  if (actionColor[action]) return actionColor[action];
  if (action.includes("create") || action.includes("approve") || action.includes("activate")) return "#22c55e";
  if (action.includes("delete") || action.includes("deactivate") || action.includes("reject")) return "#ef4444";
  if (action.includes("update") || action.includes("reset")) return "#f59e0b";
  return "#6366f1";
}

function humanizeAction(action: string): string {
  return action
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Animations ───────────────────────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 30 } },
};

export default function SuperActivityPage() {
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState("");
  const limit = 30;

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

  // ── Fetch activity
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["super", "activity", page],
    queryFn: () =>
      fetch(`/api/super/activity?page=${page}&limit=${limit}`)
        .then((r) => r.json())
        .then((d) => d.data),
    staleTime: 15_000,
  });

  const logs: any[] = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const filteredLogs = filterAction
    ? logs.filter((l: any) => l.action?.includes(filterAction))
    : logs;

  // ── Unique action types for filter dropdown
  const actionTypes = [...new Set(logs.map((l: any) => l.action))].sort();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(100,180,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,180,255,0.08) 1px, transparent 1px)`,
        backgroundSize: "40px 40px", animation: "gridPulse 4s ease-in-out infinite",
      }} />

      <motion.div variants={container} initial="hidden" animate="show"
        style={{ position: "relative", zIndex: 1, padding: "32px 28px 48px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <motion.div variants={item} style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase",
            color: dark ? "#e8f4ff" : "#0a2060", fontFamily: "var(--font-jetbrains-mono)",
          }}>SYSTEM ACTIVITY</h1>
          <p style={{ fontSize: 12, color: dimText, marginTop: 4, fontFamily: "var(--font-jetbrains-mono)" }}>
            Real-time admin activity monitor — {total} total entries
          </p>
        </motion.div>

        {/* Filter bar */}
        <motion.div variants={item} style={{
          display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} color={dimText} />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{
                padding: "8px 14px", borderRadius: 10,
                background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: "var(--spatial-glass-border)", outline: "none", fontSize: 12,
                color: dark ? "#daeeff" : "#0a2060", fontFamily: "var(--font-jetbrains-mono)",
                cursor: "pointer",
              }}
            >
              <option value="">All Actions</option>
              {actionTypes.map((a) => (
                <option key={a} value={a}>{humanizeAction(a)}</option>
              ))}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={() => refetch()}
            style={{
              background: "transparent", border: "var(--spatial-glass-border)",
              borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: dimText,
            }}
          >
            <RefreshCw size={14} />
          </motion.button>
          <span style={{ fontSize: 11, color: dimText, marginLeft: "auto", fontFamily: "var(--font-jetbrains-mono)" }}>
            Page {page} of {totalPages || 1}
          </span>
        </motion.div>

        {/* Activity feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                ...masterGlass, borderRadius: 14, padding: "14px 18px", height: 56,
                background: dark
                  ? "linear-gradient(90deg, rgba(10,30,80,0.4) 25%, rgba(26,111,255,0.12) 50%, rgba(10,30,80,0.4) 75%)"
                  : "linear-gradient(90deg, rgba(200,220,255,0.4) 25%, rgba(100,180,255,0.2) 50%, rgba(200,220,255,0.4) 75%)",
                backgroundSize: "400px 100%", animation: "shimmer 1.4s ease infinite",
              }} />
            ))
          ) : filteredLogs.length === 0 ? (
            <motion.div variants={item} style={{ ...masterGlass, padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: dimText }}>No activity logs found.</p>
            </motion.div>
          ) : (
            filteredLogs.map((log: any) => {
              const color = getActionColor(log.action);
              const isExpanded = expandedId === log.id;
              const userInfo = log.user as any;

              return (
                <motion.div key={log.id} variants={item}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = dark
                        ? "rgba(26,111,255,0.04)"
                        : "rgba(20,80,200,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 18px",
                      borderRadius: 14,
                      borderLeft: `3px solid ${color}`,
                      border: "var(--spatial-glass-border)",
                      borderLeftWidth: 3,
                      borderLeftColor: color,
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Timestamp */}
                    <span style={{
                      fontSize: 11, color: dimText, minWidth: 130, flexShrink: 0,
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}>
                      {new Date(log.created_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit",
                        hour12: false,
                      })}
                    </span>

                    {/* Action badge */}
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 6,
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                      background: `${color}18`, color, border: `1px solid ${color}30`,
                      fontFamily: "var(--font-jetbrains-mono)", textTransform: "uppercase",
                      flexShrink: 0,
                    }}>
                      {log.action?.split(".").pop() ?? "action"}
                    </span>

                    {/* User info */}
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: dark ? "#daeeff" : "#0a2060",
                      minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {userInfo?.email ?? "System"}
                      {userInfo?.center_code && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, marginLeft: 6, padding: "1px 6px",
                          borderRadius: 4, background: dark ? "rgba(26,111,255,0.10)" : "rgba(26,111,255,0.06)",
                          color: MASTER_PALETTE.accent, fontFamily: "var(--font-jetbrains-mono)",
                        }}>{userInfo.center_code}</span>
                      )}
                    </span>

                    {/* Entity */}
                    <span style={{
                      fontSize: 11, color: dimText, fontFamily: "var(--font-jetbrains-mono)",
                      flexShrink: 0,
                    }}>
                      {log.entity_type}{log.entity_id ? `:${log.entity_id.slice(0, 8)}` : ""}
                    </span>

                    {/* Expand arrow */}
                    {isExpanded ? <ChevronUp size={14} color={dimText} /> : <ChevronDown size={14} color={dimText} />}
                  </div>

                  {/* Expanded raw JSON */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{
                          margin: "4px 0 8px",
                          padding: "14px 18px",
                          borderRadius: 12,
                          background: dark ? "rgba(4,8,32,0.60)" : "rgba(220,235,255,0.50)",
                          border: "var(--spatial-glass-border)",
                          fontSize: 11,
                          fontFamily: "var(--font-jetbrains-mono)",
                          color: dark ? "rgba(160,200,255,0.70)" : "rgba(20,60,140,0.60)",
                          lineHeight: 1.6,
                          overflowX: "auto",
                        }}>
                          {log.before_value && (
                            <div style={{ marginBottom: 10 }}>
                              <span style={{ fontWeight: 700, color: "#ef4444", fontSize: 10, letterSpacing: 1 }}>BEFORE:</span>
                              <pre style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                {JSON.stringify(log.before_value, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after_value && (
                            <div>
                              <span style={{ fontWeight: 700, color: "#22c55e", fontSize: 10, letterSpacing: 1 }}>AFTER:</span>
                              <pre style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                {JSON.stringify(log.after_value, null, 2)}
                              </pre>
                            </div>
                          )}
                          {!log.before_value && !log.after_value && (
                            <span style={{ fontStyle: "italic" }}>No change data recorded.</span>
                          )}
                          {log.ip_address && (
                            <div style={{ marginTop: 8, fontSize: 10, color: dimText }}>
                              IP: {log.ip_address}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div variants={item} style={{
            display: "flex", justifyContent: "center", gap: 10, marginTop: 28,
          }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: "transparent", border: "var(--spatial-glass-border)",
                color: page <= 1 ? dimText : (dark ? "#daeeff" : "#0a2060"),
                cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1,
              }}
            >← Prev</motion.button>
            <span style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              color: MASTER_PALETTE.accent, fontFamily: "var(--font-jetbrains-mono)",
              background: dark ? "rgba(26,111,255,0.10)" : "rgba(26,111,255,0.06)",
              border: `1px solid ${dark ? "rgba(26,111,255,0.20)" : "rgba(26,111,255,0.15)"}`,
            }}>{page} / {totalPages}</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: "transparent", border: "var(--spatial-glass-border)",
                color: page >= totalPages ? dimText : (dark ? "#daeeff" : "#0a2060"),
                cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1,
              }}
            >Next →</motion.button>
          </motion.div>
        )}
      </motion.div>

      <style jsx global>{`
        @keyframes gridPulse { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.12; } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      `}</style>
    </div>
  );
}
