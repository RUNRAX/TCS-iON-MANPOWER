"use client";
/**
 * app/(super)/super/broadcast/page.tsx — Mission Control Communications Terminal
 *
 * System-wide email broadcast composer with:
 * - Target selector toggle cards (All Employees, All Admins, Everyone)
 * - Optional center code filter
 * - {name} / {employeeName} placeholder support
 * - Live preview panel with sample name
 * - Recipient count indicator
 * - Broadcast history table (last 10)
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Radio,
  Send,
  Users,
  ShieldCheck,
  Globe,
  Eye,
  Hash,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
} from "lucide-react";

/* ── Master palette ───────────────────────────────────────────────────────── */
const MASTER_PALETTE = {
  primary: "#1a6fff",
  secondary: "#0a3fa8",
  accent: "#67e8f9",
};

/* ── Target options ───────────────────────────────────────────────────────── */
const TARGETS = [
  { value: "all_employees", label: "All Employees", icon: Users, description: "Every active employee across all centers" },
  { value: "all_admins", label: "All Admins", icon: ShieldCheck, description: "Center administrators only" },
  { value: "everyone", label: "Everyone", icon: Globe, description: "All employees and admins combined" },
] as const;

/* ── Animations ───────────────────────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 30 } },
};

export default function SuperBroadcastPage() {
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();
  const queryClient = useQueryClient();

  // ── Form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"all_employees" | "all_admins" | "everyone">("all_employees");
  const [centerCode, setCenterCode] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

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

  // ── Fetch stats for live recipient count
  const { data: stats } = useQuery({
    queryKey: ["super", "stats"],
    queryFn: () => fetch("/api/super/stats").then(r => r.json()).then(d => d.data),
    staleTime: 30_000,
  });

  // ── Fetch broadcast history
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ["super", "broadcast-history"],
    queryFn: async () => {
      const res = await fetch("/api/super/activity?page=1&limit=10");
      const json = await res.json();
      const logs = json.data?.logs ?? [];
      return logs.filter((l: any) => l.action === "super_admin.system_broadcast");
    },
    staleTime: 15_000,
  });

  const broadcastHistory: any[] = historyData ?? [];

  // ── Computed: live recipient count estimate
  const recipientCount = useMemo(() => {
    if (!stats) return "—";
    if (target === "all_employees") return stats.activeEmployees ?? 0;
    if (target === "all_admins") return stats.totalAdmins ?? 0;
    return (stats.activeEmployees ?? 0) + (stats.totalAdmins ?? 0);
  }, [stats, target]);

  // ── Live preview with {name} replacement
  const previewMessage = message
    .replace(/{name}/gi, "Rakshit")
    .replace(/{employeeName}/gi, "Rakshit");

  // ── Send broadcast
  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!message.trim() || message.length < 10) { toast.error("Message must be at least 10 characters"); return; }

    setSending(true);
    setLastResult(null);
    try {
      const body: any = { subject, message, targets: target };
      if (centerCode && /^[A-Z]{3}$/.test(centerCode)) body.centerCode = centerCode;

      const res = await fetch("/api/super/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message ?? "Broadcast failed");
        return;
      }
      setLastResult(json.data);
      toast.success(`Broadcast sent to ${json.data.sent} recipients`);
      refetchHistory();
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(100,180,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,180,255,0.08) 1px, transparent 1px)`,
        backgroundSize: "40px 40px", animation: "gridPulse 4s ease-in-out infinite",
      }} />

      <motion.div variants={container} initial="hidden" animate="show"
        style={{ position: "relative", zIndex: 1, padding: "32px 28px 48px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ── */}
        <motion.div variants={item} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${MASTER_PALETTE.primary}, ${MASTER_PALETTE.secondary})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(26,111,255,0.35)",
            }}>
              <Radio size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{
                fontSize: 22, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase",
                color: dark ? "#e8f4ff" : "#0a2060", fontFamily: "var(--font-jetbrains-mono)",
              }}>SYSTEM BROADCAST</h1>
              <p style={{ fontSize: 12, color: dimText, marginTop: 2, fontFamily: "var(--font-jetbrains-mono)" }}>
                Mission control communications terminal
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Two column: Compose + Preview ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

          {/* ═══ LEFT: Compose area ═══ */}
          <motion.div variants={item} style={{ ...masterGlass, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Target selector cards */}
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                color: dimText, fontFamily: "var(--font-jetbrains-mono)", marginBottom: 10,
              }}>TARGET AUDIENCE</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {TARGETS.map((t) => {
                  const Icon = t.icon;
                  const selected = target === t.value;
                  return (
                    <motion.button
                      key={t.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTarget(t.value as any)}
                      style={{
                        padding: "14px 10px",
                        borderRadius: 14,
                        background: selected
                          ? (dark ? "rgba(26,111,255,0.12)" : "rgba(26,111,255,0.06)")
                          : (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"),
                        border: selected
                          ? `2px solid ${MASTER_PALETTE.accent}`
                          : "var(--spatial-glass-border)",
                        cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        boxShadow: selected
                          ? `0 0 16px rgba(103,232,249,0.25), 0 0 4px rgba(103,232,249,0.15)`
                          : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Icon size={18} color={selected ? MASTER_PALETTE.accent : dimText} />
                      <span style={{
                        fontSize: 11, fontWeight: selected ? 700 : 500,
                        color: selected ? MASTER_PALETTE.accent : (dark ? "#daeeff" : "#0a2060"),
                      }}>{t.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Optional center code filter */}
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                color: dimText, fontFamily: "var(--font-jetbrains-mono)", marginBottom: 6,
                display: "flex", alignItems: "center", gap: 6,
              }}><MapPin size={10} /> CENTER FILTER (optional)</p>
              <input
                value={centerCode}
                onChange={e => setCenterCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
                placeholder="e.g. BLR — leave blank for all"
                maxLength={3}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 12,
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: "var(--spatial-glass-border)", outline: "none", fontSize: 13,
                  color: dark ? "#daeeff" : "#0a2060", fontFamily: "var(--font-jetbrains-mono)",
                  letterSpacing: 2,
                }}
              />
            </div>

            {/* Subject */}
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                color: dimText, fontFamily: "var(--font-jetbrains-mono)", marginBottom: 6,
              }}>SUBJECT LINE</p>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="System Maintenance Notice..."
                maxLength={200}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 12,
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: "var(--spatial-glass-border)", outline: "none", fontSize: 13,
                  color: dark ? "#daeeff" : "#0a2060", fontFamily: "var(--font-outfit)",
                }}
              />
              <p style={{ fontSize: 10, color: dimText, marginTop: 4, textAlign: "right" }}>
                {subject.length}/200
              </p>
            </div>

            {/* Message */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                  color: dimText, fontFamily: "var(--font-jetbrains-mono)",
                }}>MESSAGE BODY</p>
                <span style={{
                  fontSize: 9, padding: "2px 8px", borderRadius: 4,
                  background: dark ? "rgba(26,111,255,0.10)" : "rgba(26,111,255,0.06)",
                  color: MASTER_PALETTE.accent, fontFamily: "var(--font-jetbrains-mono)",
                  border: `1px solid ${dark ? "rgba(26,111,255,0.20)" : "rgba(26,111,255,0.15)"}`,
                }}>
                  {"{name}"} = recipient name
                </span>
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Dear {name},\n\nWe are writing to inform you...\n\nBest regards,\nTCS iON Administration`}
                maxLength={2000}
                rows={8}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 14,
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: "var(--spatial-glass-border)", outline: "none", fontSize: 13,
                  color: dark ? "#daeeff" : "#0a2060", fontFamily: "var(--font-outfit)",
                  lineHeight: 1.7, resize: "vertical",
                }}
              />
              <p style={{ fontSize: 10, color: dimText, marginTop: 4, textAlign: "right" }}>
                {message.length}/2000
              </p>
            </div>

            {/* Recipient count + Send button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                borderRadius: 12, background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                border: "var(--spatial-glass-border)",
              }}>
                <Hash size={14} color={MASTER_PALETTE.accent} />
                <span style={{ fontSize: 12, color: dimText, fontFamily: "var(--font-jetbrains-mono)" }}>
                  Recipients:
                </span>
                <span style={{
                  fontSize: 18, fontWeight: 800, color: MASTER_PALETTE.accent,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}>
                  {centerCode ? "~" : ""}{recipientCount}
                </span>
                {centerCode && (
                  <span style={{ fontSize: 10, color: dimText }}>
                    (filtered by {centerCode})
                  </span>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 12px 40px rgba(26,111,255,0.50)" }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={sending || !subject.trim() || message.length < 10}
                style={{
                  background: sending || !subject.trim() || message.length < 10
                    ? (dark ? "rgba(100,200,255,0.10)" : "rgba(100,180,255,0.08)")
                    : `linear-gradient(135deg, ${MASTER_PALETTE.primary}, ${MASTER_PALETTE.secondary})`,
                  color: sending || !subject.trim() || message.length < 10 ? dimText : "#fff",
                  border: "none", borderRadius: 14, padding: "12px 28px",
                  fontSize: 14, fontWeight: 700, cursor: sending ? "wait" : "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  boxShadow: sending ? "none" : "0 6px 24px rgba(26,111,255,0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
                  transition: "all 0.2s ease",
                }}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? "Broadcasting..." : "Send Broadcast"}
              </motion.button>
            </div>

            {/* Result feedback */}
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    padding: "14px 18px", borderRadius: 14,
                    background: lastResult.failed === 0
                      ? (dark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.05)")
                      : (dark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.05)"),
                    border: `1px solid ${lastResult.failed === 0 ? "rgba(34,197,94,0.20)" : "rgba(245,158,11,0.20)"}`,
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  {lastResult.failed === 0
                    ? <CheckCircle2 size={16} color="#22c55e" />
                    : <XCircle size={16} color="#f59e0b" />
                  }
                  <span style={{ fontSize: 13, color: dark ? "#daeeff" : "#0a2060", fontWeight: 600 }}>
                    Delivered: {lastResult.sent} · Failed: {lastResult.failed} · Total: {lastResult.total}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ═══ RIGHT: Live preview ═══ */}
          <motion.div variants={item} style={{ ...masterGlass, padding: "24px 26px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Eye size={16} color={MASTER_PALETTE.accent} />
              <p style={{
                fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                color: dark ? "#a0d4ff" : "#1a5fa8", fontFamily: "var(--font-jetbrains-mono)",
              }}>LIVE PREVIEW</p>
            </div>

            {/* Email preview card */}
            <div style={{
              flex: 1, borderRadius: 16, overflow: "hidden",
              background: dark ? "rgba(7,7,15,0.80)" : "rgba(255,255,255,0.90)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            }}>
              {/* Subject bar */}
              <div style={{
                padding: "14px 20px",
                background: `linear-gradient(135deg, var(--tc-primary, #e0550b), #b63b07)`,
              }}>
                <p style={{
                  color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 2,
                  textTransform: "uppercase",
                }}>
                  TCS iON — System Broadcast
                </p>
              </div>

              {/* Subject line */}
              <div style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                  color: dimText, marginBottom: 4,
                }}>SUBJECT</p>
                <p style={{
                  fontSize: 14, fontWeight: 600,
                  color: dark ? "#e8f4ff" : "#0a2060",
                }}>
                  {subject || "Your subject line appears here..."}
                </p>
              </div>

              {/* Message body */}
              <div style={{ padding: "20px" }}>
                {message ? (
                  <p style={{
                    fontSize: 13, lineHeight: 1.8,
                    color: dark ? "rgba(232,244,255,0.85)" : "rgba(10,32,96,0.80)",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {previewMessage}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: dimText, fontStyle: "italic" }}>
                    Start typing your message to see the preview...
                  </p>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: "12px 20px",
                borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}`,
              }}>
                <p style={{ fontSize: 10, color: dimText, opacity: 0.5 }}>
                  TCS iON Staff Portal · This is an automated system broadcast.
                </p>
              </div>
            </div>

            {/* Placeholder hint */}
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 10,
              background: dark ? "rgba(26,111,255,0.06)" : "rgba(26,111,255,0.03)",
              border: `1px solid ${dark ? "rgba(26,111,255,0.12)" : "rgba(26,111,255,0.10)"}`,
            }}>
              <p style={{ fontSize: 11, color: dimText, lineHeight: 1.5 }}>
                <strong style={{ color: MASTER_PALETTE.accent }}>Placeholders:</strong>{" "}
                Use <code style={{
                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  padding: "1px 5px", borderRadius: 4, fontSize: 11,
                  fontFamily: "var(--font-jetbrains-mono)", color: MASTER_PALETTE.accent,
                }}>{"{name}"}</code> or <code style={{
                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  padding: "1px 5px", borderRadius: 4, fontSize: 11,
                  fontFamily: "var(--font-jetbrains-mono)", color: MASTER_PALETTE.accent,
                }}>{"{employeeName}"}</code> to personalize each email with the recipient's full name.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ═══ Broadcast History ═══ */}
        <motion.div variants={item} style={{ ...masterGlass, padding: "24px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <Clock size={16} color={MASTER_PALETTE.accent} />
            <p style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
              color: dark ? "#a0d4ff" : "#1a5fa8", fontFamily: "var(--font-jetbrains-mono)",
            }}>BROADCAST HISTORY</p>
          </div>

          {broadcastHistory.length === 0 ? (
            <p style={{ fontSize: 13, color: dimText, fontStyle: "italic" }}>
              No broadcasts sent yet. Compose your first message above.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Subject", "Target", "Center", "Sent", "Failed"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "8px 12px", fontSize: 10,
                        fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
                        color: dimText, fontFamily: "var(--font-jetbrains-mono)",
                        borderBottom: "var(--spatial-glass-border)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {broadcastHistory.map((log: any) => {
                    const after = log.after_value ?? {};
                    return (
                      <tr key={log.id}
                        onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(26,111,255,0.04)" : "rgba(20,80,200,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={{ transition: "background 0.15s ease" }}>
                        <td style={{
                          padding: "10px 12px", fontSize: 12, color: dimText,
                          fontFamily: "var(--font-jetbrains-mono)",
                          borderBottom: "var(--spatial-glass-border)",
                        }}>
                          {new Date(log.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                        </td>
                        <td style={{
                          padding: "10px 12px", fontSize: 13, fontWeight: 600,
                          color: dark ? "#daeeff" : "#0a2060",
                          maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          borderBottom: "var(--spatial-glass-border)",
                        }}>{after.subject ?? "—"}</td>
                        <td style={{
                          padding: "10px 12px",
                          borderBottom: "var(--spatial-glass-border)",
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                            background: dark ? "rgba(26,111,255,0.10)" : "rgba(26,111,255,0.06)",
                            color: MASTER_PALETTE.accent, fontFamily: "var(--font-jetbrains-mono)",
                            border: `1px solid ${dark ? "rgba(26,111,255,0.20)" : "rgba(26,111,255,0.15)"}`,
                          }}>{after.targets ?? "—"}</span>
                        </td>
                        <td style={{
                          padding: "10px 12px", fontSize: 12, fontWeight: 700,
                          color: MASTER_PALETTE.accent, fontFamily: "var(--font-jetbrains-mono)",
                          letterSpacing: 1,
                          borderBottom: "var(--spatial-glass-border)",
                        }}>{after.centerCode ?? "ALL"}</td>
                        <td style={{
                          padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#22c55e",
                          borderBottom: "var(--spatial-glass-border)",
                        }}>{after.sent ?? 0}</td>
                        <td style={{
                          padding: "10px 12px", fontSize: 13, fontWeight: 700,
                          color: (after.failed ?? 0) > 0 ? "#ef4444" : dimText,
                          borderBottom: "var(--spatial-glass-border)",
                        }}>{after.failed ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      <style jsx global>{`
        @keyframes gridPulse { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.12; } }
      `}</style>
    </div>
  );
}
