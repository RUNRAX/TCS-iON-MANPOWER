"use client";
import { useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAdminStats, useAdminEmployees, useAdminShifts } from "@/hooks/use-api";
import { BarChart2, RefreshCw, Download, Users, Calendar, Check, Wallet, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function autoWidth(ws: XLSX.WorkSheet, data: Record<string, unknown>[]): void {
  if (!data.length) return;
  const cols = Object.keys(data[0]);
  ws["!cols"] = cols.map(col => ({
    wch: Math.max(
      col.length + 2,
      ...data.map(row => String(row[col] ?? "").length + 2)
    ),
  }));
}

function stylishHeader(ws: XLSX.WorkSheet, headers: string[]): void {
  headers.forEach((_, idx) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: idx });
    if (!ws[cell]) return;
    ws[cell].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "5B5BD6" } },
      alignment: { horizontal: "center" },
    };
  });
}

function downloadSheet(wb: XLSX.WorkBook, name: string): void {
  XLSX.writeFile(wb, `${name}-${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ── Export builders ───────────────────────────────────────────────────────────

async function exportEmployees(): Promise<void> {
  const res = await fetch("/api/admin/employees?limit=999");
  if (!res.ok) throw new Error("Failed to fetch employees");
  const json = await res.json();
  const employees: Array<Record<string, unknown>> = json.data?.employees ?? [];

  const rows = employees.map((e, i) => ({
    "#":             i + 1,
    "Full Name":     e.full_name ?? "—",
    "Email":         e.email ?? "—",
    "Phone":         e.phone ?? "—",
    "City":          e.city ?? "—",
    "State":         e.state ?? "—",
    "Status":        String(e.status ?? "—").toUpperCase(),
    "Active":        e.is_active ? "Yes" : "No",
    "Joined":        e.joined_at ? new Date(e.joined_at as string).toLocaleDateString("en-IN") : "—",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws, rows);
  stylishHeader(ws, Object.keys(rows[0] ?? {}));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 }; // freeze header row

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  downloadSheet(wb, "employees");
}

async function exportShifts(): Promise<void> {
  const res = await fetch("/api/admin/shifts?limit=999");
  if (!res.ok) throw new Error("Failed to fetch shifts");
  const json = await res.json();
  const shifts: Array<Record<string, unknown>> = json.data?.shifts ?? [];

  const rows = shifts.map((s, i) => ({
    "#":             i + 1,
    "Title":         s.title ?? "—",
    "Exam Date":     s.examDate ?? s.exam_date ?? "—",
    "Shift No.":     s.shiftNumber ?? s.shift_number ?? "—",
    "Start Time":    s.startTime ?? s.start_time ?? "—",
    "End Time":      s.endTime ?? s.end_time ?? "—",
    "Venue":         s.venue ?? "—",
    "Status":        String(s.status ?? "—").toUpperCase(),
    "Confirmed":     s.confirmed_count ?? 0,
    "Max Staff":     s.maxEmployees ?? s.max_employees ?? "—",
    "Pay (₹)":       s.pay_amount ?? s.payAmount ?? "—",
    "Notes":         s.notes ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws, rows);
  stylishHeader(ws, Object.keys(rows[0] ?? {}));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Shifts");
  downloadSheet(wb, "shifts");
}

async function exportPayments(): Promise<void> {
  const res = await fetch("/api/admin/payments");
  if (!res.ok) throw new Error("Failed to fetch payments");
  const json = await res.json();
  const payments: Array<Record<string, unknown>> = json.data?.payments ?? [];

  const rows = payments.map((p, i) => ({
    "#":               i + 1,
    "Employee Name":   p.employeeName ?? "—",
    "Phone":           p.phone ?? "—",
    "Shift Date":      p.shiftDate ? new Date(p.shiftDate as string).toLocaleDateString("en-IN") : "—",
    "Shift No.":       p.shiftNumber ?? "—",
    "Venue":           p.venue ?? "—",
    "Amount (₹)":      p.amountRupees ?? 0,
    "Status":          String(p.status ?? "—").toUpperCase(),
    "Reference No.":   p.referenceNumber ?? "—",
    "Cleared On":      p.clearedAt ? new Date(p.clearedAt as string).toLocaleDateString("en-IN") : "—",
  }));

  // Summary row at the bottom
  const totalPaid    = payments.filter(p => p.status === "cleared").reduce((s, p) => s + ((p.amountRupees as number) ?? 0), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + ((p.amountRupees as number) ?? 0), 0);

  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws, rows);
  stylishHeader(ws, Object.keys(rows[0] ?? {}));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Append summary below data
  const summaryStart = rows.length + 3;
  XLSX.utils.sheet_add_aoa(ws, [
    ["", "", "", "", "", "TOTAL PAID (₹)",    totalPaid,    "", "", ""],
    ["", "", "", "", "", "TOTAL PENDING (₹)", totalPending, "", "", ""],
  ], { origin: { r: summaryStart, c: 0 } });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payments");
  downloadSheet(wb, "payments");
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminExcelPage() {
  const { theme: t, dark } = useTheme();
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: empData } = useAdminEmployees({ limit: 999 });
  const { data: shiftData } = useAdminShifts({ limit: 999 });

  const s = stats as { totalEmployees?: number; activeShifts?: number; pendingPayments?: number } | undefined;
  const employees = (empData as { employees?: Array<{ status?: string }> } | undefined)?.employees ?? [];
  const shifts    = (shiftData as { shifts?: unknown[] } | undefined)?.shifts ?? [];

  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const card      = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const border    = dark ? `color-mix(in srgb, var(--tc-primary) 15%, transparent)` : `var(--tc-primary)`;

  const handleExport = async (type: "employees" | "shifts" | "payments") => {
    setLoadingType(type);
    try {
      if (type === "employees") await exportEmployees();
      if (type === "shifts")    await exportShifts();
      if (type === "payments")  await exportPayments();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully ✓`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoadingType(null);
    }
  };

  const exports = [
    {
      type:    "employees" as const,
      label:   "Employee List",
      desc:    "Name, email, phone, city, status, join date",
      count:   `${employees.length} records`,
      icon:    Users,
      color:   "var(--tc-primary)",
      columns: ["#", "Full Name", "Email", "Phone", "City", "State", "Status", "Active", "Joined"],
    },
    {
      type:    "shifts" as const,
      label:   "Shift Schedule",
      desc:    "Date, venue, times, confirmed count, pay",
      count:   `${shifts.length} records`,
      icon:    Calendar,
      color:   "var(--tc-secondary)",
      columns: ["#", "Title", "Exam Date", "Shift No.", "Start–End", "Venue", "Status", "Confirmed", "Pay (₹)"],
    },
    {
      type:    "payments" as const,
      label:   "Payment Report",
      desc:    "Employee, shift, amount, status, reference",
      count:   "All transactions",
      icon:    Wallet,
      color:   "#10b981",
      columns: ["#", "Employee", "Phone", "Shift Date", "Venue", "Amount (₹)", "Status", "Reference"],
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: textMain, marginBottom: 4 }}>Reports & Export</h1>
          <p style={{ fontSize: 13, color: textMuted }}>Download clean, formatted Excel spreadsheets</p>
        </div>
        <button onClick={() => refetchStats()} style={{ padding: "7px 10px", borderRadius: 8, background: card, border: `1px solid ${border}`, cursor: "pointer", color: textMuted }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Total Employees",  value: s?.totalEmployees  ?? "–", icon: Users,    color: "var(--tc-primary)" },
          { label: "Active Shifts",    value: s?.activeShifts    ?? "–", icon: Calendar, color: "var(--tc-secondary)" },
          { label: "Pending Payments", value: s?.pendingPayments ?? "–", icon: Wallet,   color: "#f59e0b" },
          { label: "Approved",         value: employees.filter(e => e.status === "approved").length || "–", icon: Check, color: "#10b981" },
        ].map(sc => (
          <div key={sc.label} className="admin-panel" style={{ position: "relative", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${sc.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <sc.icon size={14} style={{ color: sc.color }} />
              </div>
              <span style={{ fontSize: 10, color: textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{sc.label}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: textMain }}>{statsLoading ? "…" : sc.value}</p>
          </div>
        ))}
      </div>

      {/* Export cards */}
      <h2 style={{ fontSize: 14, fontWeight: 600, color: textMain, marginBottom: 14, letterSpacing: 0.3 }}>Export to Excel</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 32 }}>
        {exports.map(ex => {
          const isLoading = loadingType === ex.type;
          return (
            <div key={ex.type} className="admin-panel" style={{ position: "relative", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Title row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: `${ex.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ex.icon size={16} style={{ color: ex.color }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: textMain, fontSize: 14 }}>{ex.label}</p>
                  <p style={{ fontSize: 11, color: textMuted }}>{ex.count}</p>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.5 }}>{ex.desc}</p>

              {/* Column preview */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {ex.columns.map(col => (
                  <span key={col} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: `${ex.color}12`, color: ex.color, fontWeight: 600, letterSpacing: 0.3 }}>
                    {col}
                  </span>
                ))}
              </div>

              {/* Download button — glass frost */}
              <button
                onClick={() => handleExport(ex.type)}
                disabled={loadingType !== null}
                className="admin-panel"
                style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", borderRadius: 11, background: isLoading ? `${ex.color}30` : `linear-gradient(135deg,${ex.color},${ex.color}cc)`, border: "none", color: "#fff", cursor: loadingType !== null ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, opacity: loadingType !== null && !isLoading ? 0.5 : 1, transition: "all 0.2s", marginTop: 4, backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" }}>
                {isLoading
                  ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} /> Generating…</>
                  : <><FileSpreadsheet size={14} /> Download .xlsx</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Preview of what's in each file — glass frost matching export tiles */}
      <div className="admin-panel" style={{ position: "relative", borderRadius: 16, padding: 22 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: textMain, marginBottom: 4 }}>What's included</h2>
        <p style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>Each file is a formatted Excel workbook with frozen headers and auto-sized columns.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Employee List",   detail: "Full details — name, contact, address, approval status, join date", color: "var(--tc-primary)", icon: Users },
            { label: "Shift Schedule",  detail: "All shifts — date, venue, timing, staff count, pay per shift", color: "var(--tc-secondary)", icon: Calendar },
            { label: "Payment Report",  detail: "All payments — employee details, shift info, amount, reference, cleared date + totals summary", color: "#10b981", icon: Wallet },
          ].map(row => (
            <div key={row.label} className="admin-panel" style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s cubic-bezier(0.4,0,0.2,1)", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.01)"; e.currentTarget.style.boxShadow = dark ? "0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" : "0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${row.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <row.icon size={16} style={{ color: row.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: textMain, marginBottom: 2 }}>{row.label}</p>
                <p style={{ fontSize: 11, color: textMuted, lineHeight: 1.4 }}>{row.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
