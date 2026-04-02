"use client";
import { useTheme } from "@/lib/context/ThemeContext";
import { useEmployeePayments } from "@/hooks/use-api";
import { Wallet, Check, Clock, Calendar, FileText } from "lucide-react";

export default function EmployeePaymentsPage() {
  const { theme: t, dark } = useTheme();
  const { data, isLoading } = useEmployeePayments();

  const payments = (data as { payments?: Array<{
    id: string; shiftDate: string; shiftNumber: number;
    venue: string; amountRupees: number; status: string;
    referenceNumber: string | null; clearedAt: string | null;
  }> } | undefined)?.payments ?? [];

  const totalEarned = payments.filter(p => p.status === "cleared").reduce((s, p) => s + p.amountRupees, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amountRupees, 0);

  const textMain = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const card = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const border = dark ? `color-mix(in srgb, var(--tc-primary) 15%, transparent)` : `var(--tc-primary)`;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: textMain, marginBottom: 4 }}>My Payments</h1>
        <p style={{ fontSize: 13, color: textMuted }}>Track your earnings and payment status</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Earned", value: `₹${totalEarned}`, icon: Check, color: "#10B981" },
          { label: "Pending",      value: `₹${totalPending}`, icon: Clock, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="admin-panel" style={{ position: "relative", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <s.icon size={15} style={{ color: s.color }} />
              <span style={{ fontSize: 11, color: textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: textMain }}>{isLoading ? "…" : s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: textMuted }}>Loading payments…</div>
      ) : payments.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Wallet size={40} style={{ color: textMuted, margin: "0 auto 16px" }} />
          <p style={{ color: textMuted }}>No payment records yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {payments.map(p => (
            <div key={p.id} className="admin-panel" style={{ position: "relative", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <Calendar size={12} style={{ color: "var(--tc-primary)" }} />
                  <span style={{ fontSize: 13, color: textMain }}>{new Date(p.shiftDate).toLocaleDateString("en-IN")}</span>
                </div>
                <p style={{ fontSize: 12, color: textMuted }}>{p.venue} · Shift #{p.shiftNumber}</p>
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: textMain }}>₹{p.amountRupees}</div>
              <div style={{ minWidth: 80, textAlign: "right" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600, background: p.status === "cleared" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: p.status === "cleared" ? "#10B981" : "#f59e0b" }}>
                  {p.status === "cleared" ? "Paid" : "Pending"}
                </span>
                {p.referenceNumber && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, justifyContent: "flex-end" }}>
                    <FileText size={10} style={{ color: textMuted }} />
                    <span style={{ fontSize: 10, color: textMuted }}>{p.referenceNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
