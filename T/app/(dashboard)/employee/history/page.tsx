"use client";
import { useTheme } from "@/lib/context/ThemeContext";
import { useEmployeeHistory } from "@/hooks/use-api";
import { Clock, Calendar, Wallet, Check, MapPin } from "lucide-react";

export default function EmployeeHistoryPage() {
  const { theme: t, dark } = useTheme();
  const { data, isLoading } = useEmployeeHistory();

  const history = (data as { history?: Array<{
    id: string; shiftDate: string; shiftNumber: number;
    venue: string; amountRupees: number; status: string;
    referenceNumber: string | null; clearedAt: string | null;
  }> } | undefined)?.history ?? [];

  const textMain = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const card = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const border = dark ? `color-mix(in srgb, var(--tc-primary) 15%, transparent)` : `var(--tc-primary)`;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: textMain, marginBottom: 4 }}>My Bookings</h1>
        <p style={{ fontSize: 13, color: textMuted }}>Your confirmed shifts and payment history</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: textMuted }}>Loading history…</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Clock size={40} style={{ color: textMuted, margin: "0 auto 16px" }} />
          <p style={{ color: textMuted }}>No bookings yet. Book a shift to see it here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.map(h => (
            <div key={h.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Calendar size={13} style={{ color: "var(--tc-primary)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{new Date(h.shiftDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={12} style={{ color: textMuted }} />
                  <span style={{ fontSize: 12, color: textMuted }}>{h.venue}</span>
                </div>
              </div>
              <div style={{ minWidth: 100, textAlign: "center" }}>
                <p style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Shift No.</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: textMain }}>#{h.shiftNumber}</p>
              </div>
              <div style={{ minWidth: 100, textAlign: "center" }}>
                <p style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Amount</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: textMain }}>₹{h.amountRupees}</p>
              </div>
              <div style={{ minWidth: 80, textAlign: "center" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600, background: h.status === "cleared" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: h.status === "cleared" ? "#10B981" : "#f59e0b" }}>
                  {h.status === "cleared" ? "Paid" : "Pending"}
                </span>
                {h.referenceNumber && (
                  <p style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>Ref: {h.referenceNumber}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
