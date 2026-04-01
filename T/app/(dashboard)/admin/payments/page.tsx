"use client";
/**
 * admin/payments (Bookings) page
 * Three-panel layout:
 *  1. Calendar — with shift-date markers
 *  2. Employee attendance matrix — all employees × shifts for selected date
 *  3. Export to Excel
 */
import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAdminPayments, useClearPayment } from "@/hooks/use-api";
import {
  Calendar, ChevronLeft, ChevronRight, RefreshCw,
  Wallet, Check, Clock, Download, FileSpreadsheet, Users, X, UserPlus, Search, Trash2, Plus
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ShiftMeta { id: string; title: string; shift_number: number; start_time: string; end_time: string; venue: string; status: string; }
interface Assignment  { id?: string; status?: string; duty_role?: string; notes?: string; }
interface Employee    { id: string; profileId: string; full_name: string; email: string; phone: string; assignments: Record<string, Assignment>; }
interface DateInfo    { date: string; statuses: string[]; title: string; }

// ── Type aliases — avoid nested-generic TSX parse errors in Turbopack ───────
type PendingSave    = { employeeId: string; shiftId: string; duty_role: string; notes: string; status: string };
type ClearingState  = { employeeId: string; shiftId: string; name: string };

const DUTY_ROLES = ["Invigilation", "Biometric", "Registration"] as const;
const DUTY_COLORS: Record<string, string> = {
  Invigilation: "#6366f1", Biometric: "#10b981", Registration: "#f59e0b",
};

// ── Mini calendar helpers ─────────────────────────────────────────────────────
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ── Auto-save debounce hook ───────────────────────────────────────────────────
function useAutoSave(fn: () => Promise<void>, deps: unknown[], delay = 800) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ── Row component — memoised so only changed rows re-render ──────────────────
const EmployeeRow = memo(function EmployeeRow({
  emp, shifts, dark, t, textMain, textMuted, card, border,
  onChange, onRemove,
}: {
  emp: Employee; shifts: ShiftMeta[]; dark: boolean;
  t: { primary: string; secondary: string }; textMain: string; textMuted: string;
  card: string; border: string;
  onChange: (empId: string, shiftId: string, field: "duty_role"|"notes"|"status", value: string) => void;
  onRemove?: (empId: string) => void;
}) {
  const initials = (emp.full_name ?? "?")[0]?.toUpperCase();

  return (
    <tr style={{ borderBottom: `1px solid ${border}`, transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.015)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

      {/* Employee info */}
      <td style={{ padding: "10px 12px", minWidth: 230, position: "sticky", left: 0, background: dark ? "#08071a" : "#fff", zIndex: 2, borderRight: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: textMain, marginBottom: 1 }}>{emp.full_name}</p>
            <p style={{ fontSize: 10, color: textMuted, fontFamily: "monospace", letterSpacing: 0.3 }}>
              {emp.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={() => onRemove?.(emp.id)}
            title="Remove from list"
            style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "none", cursor: "pointer", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0.7 }}>
            <Trash2 size={11} />
          </button>
        </div>
      </td>

      {/* Contact */}
      <td style={{ padding: "12px 16px", minWidth: 200, borderRight: `1px solid ${border}` }}>
        <p style={{ fontSize: 12, color: textMain, marginBottom: 2 }}>{emp.email}</p>
        <p style={{ fontSize: 11, color: textMuted }}>{emp.phone ?? "—"}</p>
      </td>

      {/* One column per shift */}
      {shifts.map(shift => {
        const asgn = emp.assignments[shift.id] ?? {};
        const role  = asgn.duty_role ?? "";
        const roleColor = role ? (DUTY_COLORS[role] ?? 'var(--tc-primary)') : undefined;

        return (
          <td key={shift.id} style={{ padding: "10px 12px", minWidth: 180, verticalAlign: "top", borderRight: `1px solid ${border}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Duty role dropdown */}
              <select
                value={role}
                onChange={e => onChange(emp.id, shift.id, "duty_role", e.target.value)}
                style={{
                  width: "100%", padding: "6px 10px", borderRadius: 8, fontSize: 12,
                  background: role ? `${roleColor}18` : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                  border: `1px solid ${role ? roleColor + "40" : (dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`,
                  color: role ? roleColor : textMuted,
                  outline: "none", cursor: "pointer", fontWeight: role ? 600 : 400,
                  transition: "all 0.2s",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 24,
                }}>
                <option value="">— Not assigned</option>
                {DUTY_ROLES.map(r => <option key={r} value={r} style={{ background: dark ? "#0d0b22" : "#fff", color: textMain }}>{r}</option>)}
              </select>

              {/* Notes textarea */}
              <textarea
                rows={2}
                value={asgn.notes ?? ""}
                onChange={e => onChange(emp.id, shift.id, "notes", e.target.value)}
                placeholder="Add note…"
                style={{
                  width: "100%", padding: "5px 8px", borderRadius: 7, fontSize: 11, resize: "none",
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                  color: textMain, outline: "none", fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={e => { e.target.style.borderColor = ""; e.target.style.boxShadow = `0 0 0 2px color-mix(in srgb, var(--tc-primary) 9%, transparent)`; }}
                onBlur={e => { e.target.style.borderColor = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </td>
        );
      })}
    </tr>
  );
});

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminBookingsPage() {
  const { theme: t, dark } = useTheme();

  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const card      = dark ? "rgba(12,9,28,0.65)" : "rgba(255,255,255,0.70)";
  const border    = dark
    ? `color-mix(in srgb, var(--tc-primary) 14%, rgba(255,255,255,0.07))`
    : `color-mix(in srgb, var(--tc-primary) 18%, rgba(255,255,255,0.80))`;
  const calBg     = dark ? "rgba(7,6,18,0.78)" : "rgba(252,251,255,0.82)";
  const glassBlur = "blur(64px) saturate(220%) brightness(1.05)";
  const cardShadow = dark
    ? "0 12px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12)"
    : "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)";

  // Calendar state
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [examDates, setExamDates] = useState<DateInfo[]>([]);

  // Attendance state
  const [shifts,    setShifts]    = useState<ShiftMeta[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  // Payments tab state
  const [showPayments, setShowPayments] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [clearing, setClearing] = useState<ClearingState | null>(null);
  const [clearForm, setClearForm] = useState({ amount: "", ref: "" });
  const { data: payData, isLoading: payLoading, refetch: refetchPay } = useAdminPayments({ status: statusFilter });
  const clearMutation = useClearPayment();

  // Pending saves queue: empId -> shiftId -> {field, value}
  const pendingSaves = useRef<Map<string, PendingSave>>(new Map());

  // Load exam dates for calendar
  useEffect(() => {
    fetch("/api/admin/bookings/dates")
      .then(r => r.json())
      .then(d => setExamDates(d.data?.dates ?? []))
      .catch(() => {});
  }, []);

  const [allAvailableEmployees, setAllAvailableEmployees] = useState<Employee[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [empSearch, setEmpSearch] = useState("");

  // Load attendance for selected date
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    fetch(`/api/admin/bookings?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => {
        setShifts(d.data?.shifts ?? []);
        const allEmps = d.data?.employees ?? [];
        
        // STRICT: Never auto-populate. Admin must ALWAYS manually add employees via the + button.
        // We keep the table completely empty on load. Only employees the admin explicitly
        // added in a PREVIOUS session (with a saved duty_role) will appear.
        setEmployees([]);
        setAllAvailableEmployees(allEmps);
      })
      .catch(() => toast.error("Failed to load attendance data"))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const addEmployee = useCallback((emp: Employee) => {
    setEmployees(prev => {
      if (prev.find(e => e.id === emp.id)) return prev; // already added
      return [...prev, { ...emp, assignments: {} }];
    });
    setShowAddEmployee(false);
    setEmpSearch("");
  }, []);

  const removeEmployee = useCallback((empId: string) => {
    setEmployees(prev => prev.filter(e => e.id !== empId));
  }, []);

  const filteredAvailable = useMemo(() =>
    allAvailableEmployees.filter(e =>
      !employees.find(a => a.id === e.id) &&
      (e.full_name?.toLowerCase().includes(empSearch.toLowerCase()) ||
       e.email?.toLowerCase().includes(empSearch.toLowerCase()) ||
       e.phone?.includes(empSearch))
    ), [allAvailableEmployees, employees, empSearch]);

  // Handle cell change — update local state immediately, queue save
  const handleCellChange = useCallback((empId: string, shiftId: string, field: "duty_role"|"notes"|"status", value: string) => {
    setEmployees(prev => prev.map(e => {
      if (e.id !== empId) return e;
      const asgn = { ...(e.assignments[shiftId] ?? {}) };
      (asgn as Record<string, string>)[field] = value;
      return { ...e, assignments: { ...e.assignments, [shiftId]: asgn } };
    }));

    // Queue for auto-save
    const key = `${empId}:${shiftId}`;
    const cur = pendingSaves.current.get(key);
    const emp = employees.find(e => e.id === empId);
    const asgn = emp?.assignments[shiftId] ?? {};
    const save: PendingSave = {
      employeeId: empId, shiftId,
      duty_role: field === "duty_role" ? value : ((asgn.duty_role as string) ?? ""),
      notes:     field === "notes"     ? value : ((asgn.notes as string)     ?? ""),
      status:    field === "status"    ? value : ((asgn.status as string)    ?? "confirmed"),
    };
    pendingSaves.current.set(key, save);
  }, [employees]);

  // Auto-save — flushes pending queue every 800ms after last change
  const flushSaves = useCallback(async () => {
    if (pendingSaves.current.size === 0) return;
    const batch = Array.from(pendingSaves.current.values());
    pendingSaves.current.clear();
    setSaving(true);
    try {
      await Promise.all(batch.map(item =>
        fetch("/api/admin/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })
      ));
    } catch (err) { void err;
      toast.error("Auto-save failed — retrying on next change");
    } finally {
      setSaving(false);
    }
  }, []);

  useAutoSave(flushSaves, [employees], 800);

  // Export attendance sheet for selected date
  const exportAttendance = useCallback(async () => {
    if (!selectedDate || !shifts.length || !employees.length) return;
    const wb = XLSX.utils.book_new();

    shifts.forEach(shift => {
      const rows = employees.map((e, i) => {
        const asgn = e.assignments[shift.id] ?? {};
        const role = (asgn.duty_role as string) ?? "";
        // Three separate duty columns — empty string (not hyphen) when not assigned
        return {
          "#":             i + 1,
          "Resource ID":   e.id.slice(0, 8).toUpperCase(),
          "Full Name":     e.full_name ?? "",
          "Email":         e.email ?? "",
          "Phone":         e.phone ?? "",
          "Invigilation":  role === "Invigilation" ? "✓" : "",
          "Biometric":     role === "Biometric"     ? "✓" : "",
          "Registration":  role === "Registration"  ? "✓" : "",
          "Notes":         (asgn.notes as string)   ?? "",
        };
      });

      const headers = Object.keys(rows[0] ?? {});
      const ws = XLSX.utils.json_to_sheet(rows);
      // Auto column widths
      ws["!cols"] = headers.map(h => ({
        wch: Math.max(h.length + 2, ...rows.map(r => String((r as Record<string,unknown>)[h] ?? "").length + 2))
      }));
      // Freeze header row
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(wb, ws, `Shift ${shift.shift_number}`);
    });

    // Summary sheet across all shifts
    const summaryRows = employees.map((e, i) => {
      const row: Record<string, unknown> = {
        "#": i + 1,
        "Resource ID": e.id.slice(0, 8).toUpperCase(),
        "Full Name": e.full_name ?? "",
        "Email": e.email ?? "",
        "Phone": e.phone ?? "",
      };
      shifts.forEach(shift => {
        const role = (e.assignments[shift.id]?.duty_role as string) ?? "";
        row[`Shift ${shift.shift_number} – Invigilation`] = role === "Invigilation" ? "✓" : "";
        row[`Shift ${shift.shift_number} – Biometric`]    = role === "Biometric"    ? "✓" : "";
        row[`Shift ${shift.shift_number} – Registration`] = role === "Registration" ? "✓" : "";
      });
      return row;
    });
    const sws = XLSX.utils.json_to_sheet(summaryRows);
    const sHeaders = Object.keys(summaryRows[0] ?? {});
    sws["!cols"] = sHeaders.map(h => ({ wch: Math.max(h.length + 2, 14) }));
    sws["!freeze"] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, sws, "Summary");

    XLSX.writeFile(wb, `attendance-${selectedDate}.xlsx`);
    toast.success("Attendance exported ✓");
  }, [selectedDate, shifts, employees]);

  // Calendar helpers
  const examDateMap = new Map(examDates.map(d => [d.date, d]));
  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  const renderCalendar = () => {
    const days = daysInMonth(calYear, calMonth);
    const first = firstDayOfMonth(calYear, calMonth);
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);

    return cells.map((day, idx) => {
      if (!day) return <div key={`blank-${idx}`} />;
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const examInfo = examDateMap.get(dateStr);
      const isSelected = dateStr === selectedDate;
      const isToday    = dateStr === today.toISOString().slice(0, 10);

      return (
        <motion.button
          key={dateStr}
          whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.94 }}
          onClick={() => setSelectedDate(dateStr)}
          style={{
            width: "100%", aspectRatio: "1", borderRadius: 10, border: "none",
            cursor: "pointer", position: "relative", fontSize: 13, fontWeight: isSelected ? 700 : 400,
            background: isSelected
              ? `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`
              : isToday ? `color-mix(in srgb, var(--tc-primary) 9%, transparent)` : "transparent",
            color: isSelected ? "#fff" : isToday ? "var(--tc-primary)" : textMain,
            boxShadow: isSelected ? `0 4px 14px color-mix(in srgb, var(--tc-primary) 27%, transparent)` : "none",
            transition: "all 0.18s ease",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
          {day}
          {examInfo && examInfo.statuses.includes("completed") && (
            <span style={{
              position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
              width: 5, height: 5, borderRadius: "50%",
              background: isSelected ? "rgba(255,255,255,0.8)" : "var(--tc-primary)",
              boxShadow: `0 0 4px currentColor`,
            }} />
          )}
        </motion.button>
      );
    });
  };

  const handleClearPayment = async () => {
    if (!clearing || !clearForm.amount) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await clearMutation.mutateAsync({ employeeId: clearing.employeeId, shiftId: clearing.shiftId, amountRupees: parseFloat(clearForm.amount), referenceNumber: clearForm.ref || undefined } as any);
      toast.success("Payment cleared ✓");
      setClearing(null); setClearForm({ amount: "", ref: "" });
    } catch (err) { void err; toast.error("Failed to clear payment"); }
  };

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1600, minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: textMain, marginBottom: 3 }}>Bookings</h1>
          <p style={{ fontSize: 13, color: textMuted }}>Select an exam date to manage attendance and duty assignments</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowPayments(false)}
            style={{ padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${border}`, background: !showPayments ? `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))` : card, color: !showPayments ? "#fff" : textMuted, transition: "all 0.2s" }}>
            Attendance
          </button>
          <button onClick={() => setShowPayments(true)}
            style={{ padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${border}`, background: showPayments ? `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))` : card, color: showPayments ? "#fff" : textMuted, transition: "all 0.2s" }}>
            Payments
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showPayments ? (
          <motion.div key="attendance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>

              {/* ── Left: Calendar ─────────────────────────────────────────── */}
              <div style={{ background: calBg, border: `1px solid ${border}`, borderRadius: 22, padding: 20, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, position: "sticky", top: 20, boxShadow: cardShadow }}>
                {/* Month nav */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: 8, background: "transparent", border: `1px solid ${border}`, cursor: "pointer", color: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: textMain }}>{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: 8, background: "transparent", border: `1px solid ${border}`, cursor: "pointer", color: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
                  {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: textMuted, padding: "4px 0" }}>{d}</div>)}
                </div>

                {/* Day cells */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                  {renderCalendar()}
                </div>

                {/* Legend */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: textMuted, marginBottom: 8, textTransform: "uppercase" }}>Legend</p>
                  {[
                    { color: "var(--tc-primary)",  label: "Completed shift" },
                  ].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: textMuted }}>{l.label}</span>
                    </div>
                  ))}
                </div>

                {/* Export + autosave indicator */}
                {selectedDate && (
                  <div style={{ marginTop: 14 }}>
                    <button
                      onClick={exportAttendance}
                      disabled={!shifts.length}
                      style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: shifts.length ? `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))` : `var(--tc-primary)`, border: "none", color: "#fff", cursor: shifts.length ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: shifts.length ? 1 : 0.5, transition: "all 0.2s" }}>
                      <FileSpreadsheet size={13} /> Export Attendance .xlsx
                    </button>
                    {saving && <p style={{ fontSize: 10, color: textMuted, textAlign: "center", marginTop: 8 }}>● Auto-saving…</p>}
                    {!saving && employees.length > 0 && <p style={{ fontSize: 10, color: "#10b981", textAlign: "center", marginTop: 8 }}>✓ All changes saved</p>}
                  </div>
                )}
              </div>

              {/* ── Right: Attendance matrix ─────────────────────────────── */}
              <div>
                {!selectedDate ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "60px 0", textAlign: "center" }}>
                    <Calendar size={48} style={{ color: textMuted, margin: "0 auto 16px", opacity: 0.4 }} />
                    <p style={{ fontSize: 15, fontWeight: 600, color: textMain, marginBottom: 8 }}>Select a date</p>
                    <p style={{ fontSize: 13, color: textMuted }}>Click a date on the calendar to manage attendance</p>
                  </motion.div>
                ) : loading ? (
                  <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
                    <div style={{ width: 32, height: 32, border: `3px solid var(--tc-primary)`, borderTopColor: "var(--tc-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                    Loading attendance…
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {/* Date header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: textMain, marginBottom: 3 }}>
                          {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </h2>
                        <p style={{ fontSize: 12, color: textMuted }}>
                          {shifts.length === 0 ? "No shifts scheduled" : `${shifts.length} shift${shifts.length > 1 ? "s" : ""} · ${employees.length} employees`}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {shifts.length > 0 && (
                          <div style={{ display: "flex", gap: 6 }}>
                            {shifts.map(s => (
                              <div key={s.id} style={{ padding: "4px 10px", borderRadius: 8, background: `color-mix(in srgb, var(--tc-primary) 15%, transparent)`, border: `1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)`, fontSize: 11, color: "var(--tc-primary)", fontWeight: 600 }}>
                                Shift {s.shift_number} · {s.start_time}–{s.end_time}
                              </div>
                            ))}
                          </div>
                        )}
                        <button onClick={() => {
                            if (shifts.length === 0) {
                              toast.error("Create a shift first", { description: "You must add a shift for this date in the Shifts tab before assigning employees." });
                              return;
                            }
                            setShowAddEmployee(true);
                          }}
                          style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px color-mix(in srgb, var(--tc-primary) 30%, transparent)" }}
                          title="Add Employee">
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {shifts.length === 0 ? (
                      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 24, padding: "60px 40px", textAlign: "center", boxShadow: dark ? "0 20px 40px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.05)" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: "color-mix(in srgb, var(--tc-primary) 10%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--tc-primary)" }}>
                          <Calendar size={28} />
                        </div>
                        <p style={{ fontSize: 18, fontWeight: 700, color: textMain, marginBottom: 8 }}>No shifts scheduled</p>
                        <p style={{ color: textMuted, fontSize: 14 }}>Create shifts in the Shifts section before assigning employees.</p>
                      </div>
                    ) : employees.length === 0 ? (
                      <motion.div initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{ position: "relative", overflow: "hidden", background: dark ? "linear-gradient(135deg, rgba(8,7,18,0.8), rgba(15,12,32,0.6))" : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,245,255,0.7))", border: `1px solid ${border}`, borderRadius: 28, padding: "70px 40px", textAlign: "center", backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, boxShadow: dark ? "0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)" : "0 20px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)" }}>
                        
                        {/* Decorative background rays */}
                        <div style={{ position: "absolute", top: "-50%", left: "-50%", right: "-50%", bottom: "-50%", background: "conic-gradient(from 0deg, transparent 0deg, color-mix(in srgb, var(--tc-primary) 8%, transparent) 60deg, transparent 120deg)", animation: "spin 20s linear infinite", opacity: 0.6, pointerEvents: "none" }} />

                        <div style={{ position: "relative", zIndex: 2 }}>
                          <motion.div whileHover={{ scale: 1.05, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#fff", boxShadow: "0 10px 30px color-mix(in srgb, var(--tc-primary) 40%, transparent), inset 0 2px 0 rgba(255,255,255,0.2)" }}>
                            <UserPlus size={36} strokeWidth={1.5} />
                          </motion.div>
                          
                          <h3 style={{ fontSize: 24, fontWeight: 800, color: textMain, marginBottom: 12, letterSpacing: -0.5 }}>Assign Staff Manually</h3>
                          <p style={{ color: textMuted, fontSize: 15, maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.5 }}>
                            No employees are currently scheduled for duty. Click below to view available staff and slot them into today's shifts.
                          </p>
                          
                          <motion.button whileHover={{ scale: 1.04, boxShadow: "0 12px 24px color-mix(in srgb, var(--tc-primary) 30%, transparent)" }} whileTap={{ scale: 0.96 }} onClick={() => setShowAddEmployee(true)}
                            style={{ padding: "14px 28px", borderRadius: 18, background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`, color: textMain, cursor: "pointer", fontSize: 15, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10, backdropFilter: "blur(10px)", transition: "all 0.2s" }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Plus size={14} color="#fff" strokeWidth={3} />
                            </div>
                            Select Employees
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      <div style={{ background: dark ? "rgba(8,7,18,0.92)" : "rgba(252,251,255,0.96)", border: `1px solid ${border}`, borderRadius: 20, overflow: "hidden", backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, boxShadow: cardShadow }}>
                        {/* Add employee button */}
                      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: textMuted }}>{employees.length} employee{employees.length !== 1 ? "s" : ""} added</span>
                        <button onClick={() => setShowAddEmployee(true)}
                          style={{ padding: "6px 14px", borderRadius: 9, background: "color-mix(in srgb, var(--tc-primary) 14%, transparent)", border: "1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)", color: "var(--tc-primary)", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          <UserPlus size={12} /> Add Employee
                        </button>
                      </div>
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 320px)" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", position: "sticky", top: 0, zIndex: 3 }}>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", borderBottom: `1px solid ${border}`, borderRight: `1px solid ${border}`, position: "sticky", left: 0, background: dark ? "#0c0b20" : "#f8f8ff", zIndex: 4, minWidth: 220 }}>
                                  Employee
                                </th>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", borderBottom: `1px solid ${border}`, borderRight: `1px solid ${border}`, minWidth: 200 }}>
                                  Contact
                                </th>
                                {shifts.map(s => (
                                  <th key={s.id} style={{ padding: "12px 16px", textAlign: "left", borderBottom: `1px solid ${border}`, borderRight: `1px solid ${border}`, minWidth: 180 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: textMain, marginBottom: 2 }}>Shift {s.shift_number}</div>
                                    <div style={{ fontSize: 10, color: "var(--tc-primary)" }}>{s.start_time}–{s.end_time}</div>
                                    <div style={{ fontSize: 10, color: textMuted, marginTop: 1 }}>{s.venue}</div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {employees.map(emp => (
                                <EmployeeRow
                                  key={emp.id}
                                  emp={emp} shifts={shifts}
                                  dark={dark} t={t}
                                  textMain={textMain} textMuted={textMuted}
                                  card={card} border={border}
                                  onChange={handleCellChange}
                                  onRemove={removeEmployee}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ padding: "10px 16px", borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
                          {DUTY_ROLES.map(r => (
                            <div key={r} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 3, background: DUTY_COLORS[r] }} />
                              <span style={{ fontSize: 10, color: textMuted }}>{r}</span>
                            </div>
                          ))}
                          <span style={{ marginLeft: "auto", fontSize: 10, color: saving ? "#f59e0b" : "#10b981" }}>
                            {saving ? "● Saving…" : "✓ Saved"}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="payments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 16, gap: 8 }}>
              {(["", "pending", "cleared"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s || undefined)}
                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${border}`, background: statusFilter === (s || undefined) ? "var(--tc-primary)" : card, color: statusFilter === (s || undefined) ? "#fff" : textMuted, transition: "all 0.2s" }}>
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
                </button>
              ))}
              <button onClick={() => refetchPay()} style={{ padding: "6px 10px", borderRadius: 8, background: card, border: `1px solid ${border}`, cursor: "pointer", color: textMuted }}><RefreshCw size={14} /></button>
            </div>

            {payLoading ? (
              <div style={{ textAlign: "center", padding: 60, color: textMuted }}>Loading payments…</div>
            ) : ((payData as { payments?: unknown[] } | undefined)?.payments ?? []).length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: textMuted }}>No payments found.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {((payData as { payments?: Array<{ id: string; employeeId: string; shiftId: string; employeeName: string; phone: string; shiftDate: string; shiftNumber: number; venue: string; amountRupees: number; status: string; referenceNumber: string | null; clearedAt: string | null; }> } | undefined)?.payments ?? []).map(p => (
                  <div key={p.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: textMain }}>{p.employeeName}</p>
                      <p style={{ fontSize: 12, color: textMuted }}>{p.phone}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Calendar size={13} style={{ color: "var(--tc-primary)" }} />
                        <span style={{ fontSize: 12, color: textMain }}>{new Date(p.shiftDate).toLocaleDateString("en-IN")}</span>
                      </div>
                      <p style={{ fontSize: 12, color: textMuted }}>{p.venue}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 120, textAlign: "right" }}>
                      <p style={{ fontWeight: 700, fontSize: 16, color: textMain }}>₹{p.amountRupees}</p>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: p.status === "cleared" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: p.status === "cleared" ? "#10B981" : "#f59e0b" }}>{p.status}</span>
                    </div>
                    {p.status === "pending" && (
                      <button onClick={() => setClearing({ employeeId: p.employeeId, shiftId: p.shiftId, name: p.employeeName })}
                        style={{ padding: "7px 16px", borderRadius: 8, background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Clear
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {clearing && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.50)", backdropFilter: "blur(28px) saturate(160%)", WebkitBackdropFilter: "blur(28px) saturate(160%)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: dark ? "#0d0b22" : "#fff", border: `1px solid ${border}`, borderRadius: 18, padding: 32, width: 360 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: textMain, marginBottom: 4 }}>Clear Payment</h3>
                  <p style={{ fontSize: 13, color: textMuted, marginBottom: 20 }}>for {clearing.name}</p>
                  {(["amount", "ref"] as const).map(field => (
                    <div key={field} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, color: textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>{field === "amount" ? "Amount (₹)" : "Reference No."}</label>
                      <input type={field === "amount" ? "number" : "text"} value={clearForm[field]} onChange={e => setClearForm(f => ({ ...f, [field]: e.target.value }))} className="tc-input" />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={() => setClearing(null)} style={{ flex: 1, padding: 10, borderRadius: 9, background: card, border: `1px solid ${border}`, color: textMuted, cursor: "pointer" }}>Cancel</button>
                    <button onClick={handleClearPayment} disabled={clearMutation.isPending || !clearForm.amount}
                      style={{ flex: 2, padding: 10, borderRadius: 9, background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, opacity: clearMutation.isPending ? 0.7 : 1 }}>
                      {clearMutation.isPending ? "Clearing…" : "Confirm Clear"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal — rendered outside AnimatePresence so it's always in the portal */}
      <AnimatePresence>
        {showAddEmployee && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 9990, backdropFilter: "blur(28px) saturate(160%)", WebkitBackdropFilter: "blur(28px) saturate(160%)", background: "rgba(0,0,0,0.45)" }}
              onClick={() => { setShowAddEmployee(false); setEmpSearch(""); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 440, damping: 32 }}
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 9999, width: "min(440px, 92vw)", maxHeight: "70vh", borderRadius: 28, background: dark ? "rgba(10,8,24,0.88)" : "rgba(255,255,255,0.92)", backdropFilter: "blur(80px) saturate(220%)", WebkitBackdropFilter: "blur(80px) saturate(220%)", border: `1px solid ${dark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.92)"}`, boxShadow: dark ? "0 40px 100px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.14)" : "0 24px 70px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.95)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "18px 20px 12px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div><p style={{ fontSize: 15, fontWeight: 700, color: textMain }}>Add Employee</p><p style={{ fontSize: 11, color: textMuted }}>{filteredAvailable.length} available</p></div>
                <button onClick={() => { setShowAddEmployee(false); setEmpSearch(""); }} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={13} /></button>
              </div>
              <div style={{ padding: "12px 16px", flexShrink: 0, borderBottom: `1px solid ${border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 10, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${border}` }}>
                  <Search size={13} style={{ color: textMuted, flexShrink: 0 }} />
                  <input autoFocus value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search by name, email or phone…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: textMain, fontSize: 13 }} />
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {filteredAvailable.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: textMuted, fontSize: 13 }}>{empSearch ? "No employees match your search" : "All employees already added"}</div>
                ) : filteredAvailable.map((emp, i) => (
                  <motion.div key={emp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => addEmployee(emp)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer", borderBottom: `1px solid ${border}`, transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{(emp.full_name ?? "?")[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontWeight: 600, fontSize: 13, color: textMain, marginBottom: 2 }}>{emp.full_name}</p><p style={{ fontSize: 11, color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email} · {emp.phone}</p></div>
                    <UserPlus size={14} style={{ color: "var(--tc-primary)", flexShrink: 0 }} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
