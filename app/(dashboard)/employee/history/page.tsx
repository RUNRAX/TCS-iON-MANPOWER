"use client";
import React, { useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { useEmployeeHistory } from "@/hooks/use-api";
import { Clock, Calendar, Wallet, MapPin, CheckCheck, PlayCircle, CalendarDays, Loader2 } from "lucide-react";

/* ── Helper: get today string YYYY-MM-DD ── */
function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

/* ── Shift temporal status based on date ── */
function getTemporalStatus(shiftDate: string): "completed" | "ongoing" | "upcoming" {
  const today = todayStr();
  if (shiftDate < today) return "completed";
  if (shiftDate === today) return "ongoing";
  return "upcoming";
}

export default function EmployeeHistoryPage() {
  const { theme: t, dark } = useTheme();
  const { data, isLoading } = useEmployeeHistory();

  const history = (data as { history?: Array<{
    id: string; shiftId?: string; title?: string;
    shiftDate: string; shiftNumber: number;
    start_time?: string; end_time?: string;
    venue: string; amountRupees: number; status: string;
    payment_status?: string | null;
    referenceNumber: string | null; confirmed_at?: string | null;
  }> } | undefined)?.history ?? [];

  /* ── Categorize by date ── */
  const ongoing = useMemo(() => history.filter(h => getTemporalStatus(h.shiftDate) === "ongoing"), [history]);
  const upcoming = useMemo(() => history.filter(h => getTemporalStatus(h.shiftDate) === "upcoming"), [history]);
  const completed = useMemo(() => history.filter(h => getTemporalStatus(h.shiftDate) === "completed"), [history]);

  const textMain = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const borderCol = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  /* ── Badge styling ── */
  const temporalBadge = (temporal: string) => {
    if (temporal === "completed") return { bg: "rgba(16,185,129,0.15)", fg: "#34d399", label: "Completed ✓" };
    if (temporal === "ongoing") return { bg: "rgba(59,130,246,0.15)", fg: "#60a5fa", label: "🔴 Ongoing" };
    return { bg: "rgba(99,102,241,0.12)", fg: "#818cf8", label: "Upcoming" };
  };

  const paymentBadge = (payStatus: string | null | undefined) => {
    if (payStatus === "cleared") return { bg: "rgba(16,185,129,0.15)", fg: "#10B981", label: "Paid" };
    return { bg: "rgba(245,158,11,0.15)", fg: "#f59e0b", label: "Pending" };
  };

  /* ── Row component ── */
  const ShiftRow = ({ h, temporal }: { h: typeof history[0]; temporal: string }) => {
    const tBadge = temporalBadge(temporal);
    const pBadge = paymentBadge(h.payment_status);
    const isCompleted = temporal === "completed";
    const isOngoing = temporal === "ongoing";

    return (
      <div
        className="admin-panel"
        style={{
          position: "relative",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          ...(isCompleted ? {
            background: dark ? "rgba(20,18,40,0.4)" : "rgba(255,255,255,0.4)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}`,
            boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.2)" : "0 8px 32px rgba(31,38,135,0.07)",
            opacity: 0.85,
          } : isOngoing ? {
            border: "2px solid rgba(59,130,246,0.4)",
            boxShadow: "0 0 20px rgba(59,130,246,0.15)",
          } : {})
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 40, height: 40, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            background: isCompleted ? "rgba(16,185,129,0.12)" : isOngoing ? "rgba(59,130,246,0.12)" : "rgba(99,102,241,0.12)",
            color: isCompleted ? "#34d399" : isOngoing ? "#60a5fa" : "#818cf8",
          }}
        >
          {isCompleted ? <CheckCheck size={18} /> : isOngoing ? <PlayCircle size={18} /> : <CalendarDays size={18} />}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: textMain }}>
              {h.title ?? "Shift"} — #{h.shiftNumber}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: tBadge.bg, color: tBadge.fg }}>
              {tBadge.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: textMuted }}>
              <Calendar size={11} />
              {new Date(h.shiftDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
            {h.start_time && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: textMuted }}>
                <Clock size={11} />
                {h.start_time?.slice(0, 5)}–{h.end_time?.slice(0, 5)}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: textMuted }}>
              <MapPin size={11} />
              {h.venue}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div style={{ minWidth: 80, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Amount</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: textMain }}>₹{h.amountRupees}</p>
        </div>

        {/* Payment status */}
        {isCompleted && (
          <div style={{ minWidth: 80, textAlign: "center" }}>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600,
              background: pBadge.bg, color: pBadge.fg,
            }}>
              {pBadge.label}
            </span>
            {h.referenceNumber && (
              <p style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>Ref: {h.referenceNumber}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: textMain, marginBottom: 4 }}>My Bookings</h1>
        <p style={{ fontSize: 13, color: textMuted }}>Your confirmed shifts and payment history</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: textMuted }}>
          <Loader2 size={30} style={{ margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          Loading bookings…
        </div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Clock size={40} style={{ color: textMuted, margin: "0 auto 16px" }} />
          <p style={{ color: textMuted }}>No bookings yet. Book a shift to see it here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Ongoing ── */}
          {ongoing.length > 0 && (
            <section>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: textMain, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 2s infinite" }} />
                Ongoing ({ongoing.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ongoing.map(h => <ShiftRow key={h.id} h={h} temporal="ongoing" />)}
              </div>
            </section>
          )}

          {/* ── Upcoming ── */}
          {upcoming.length > 0 && (
            <section>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: textMain, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarDays size={16} style={{ color: "#818cf8" }} />
                Upcoming ({upcoming.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcoming.map(h => <ShiftRow key={h.id} h={h} temporal="upcoming" />)}
              </div>
            </section>
          )}

          {/* ── Completed (glass frost) ── */}
          {completed.length > 0 && (
            <section>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: textMain, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCheck size={16} style={{ color: "#34d399" }} />
                Completed ({completed.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {completed.map(h => <ShiftRow key={h.id} h={h} temporal="completed" />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
