"use client";
import React, { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAdminShifts, useCreateShift, usePatchShift } from "@/hooks/use-api";
import { CalendarDays, Plus, Clock, Users, MapPin, X, XCircle, CheckCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Wand2, Loader2, FileText, ArrowRight, ArrowLeft } from "lucide-react";
import GlassCalendar from "@/components/ui/GlassCalendar";
import { toast } from "sonner";

// ── iOS 26 Glassmorphism helpers ─────────────────────────────────────────────
const glass = {
  dark: {
    bg:          "rgba(12, 9, 30, 0.78)",
    border:      "rgba(255,255,255,0.13)",
    innerBorder: "rgba(255,255,255,0.07)",
    shadow:      "0 48px 120px rgba(0,0,0,0.65), 0 16px 48px rgba(0,0,0,0.40), 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.20)",
    inputBg:     "rgba(255,255,255,0.06)",
    inputBorder: "rgba(255,255,255,0.11)",
    blur:        "blur(80px) saturate(220%) brightness(1.06)",
    cardBorder:  "rgba(255,255,255,0.11)",
    cardShadow:  "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.09)",
  },
  light: {
    bg:          "rgba(255,255,255,0.82)",
    border:      "rgba(255,255,255,0.92)",
    innerBorder: "rgba(0,0,0,0.05)",
    shadow:      "0 48px 120px rgba(0,0,0,0.14), 0 16px 48px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04)",
    inputBg:     "rgba(0,0,0,0.03)",
    inputBorder: "rgba(0,0,0,0.09)",
    blur:        "blur(80px) saturate(200%) brightness(1.02)",
    cardBorder:  "rgba(255,255,255,0.85)",
    cardShadow:  "0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)",
  },
};

// Date helpers
function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
function addDays(s: string, n: number) {
  const [y, mo, day] = s.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1, day + n));
  return d.toISOString().slice(0, 10);
}
function prettyDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  });
}

const EMPTY_SHIFT = { shiftNumber: 1, startTime: "09:00", endTime: "13:00", maxEmployees: 10, minEmployees: 1, payAmount: 800, notes: "" };
const EMPTY_MULTI_FORM = { title: "", venue: "", examDate: "", shifts: [{ ...EMPTY_SHIFT }] };

export default function AdminShifts() {
  const { theme: t, dark } = useTheme();
  const g = dark ? glass.dark : glass.light;
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.52)" : "rgba(30,20,80,0.45)";
  const cardBg    = dark ? "rgba(12,9,28,0.48)" : "rgba(255,255,255,0.35)";
  const borderCol = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState(selectedDate);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_MULTI_FORM, examDate: selectedDate });
  const [statusFilter, setStatusFilter] = useState("all");

  const [confirmingComplete, setConfirmingComplete] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  const [shiftDetails, setShiftDetails] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => setMounted(true), []);

  const { data, isLoading, refetch } = useAdminShifts({ status: statusFilter === "all" ? undefined : statusFilter });
  const { mutateAsync: createShiftAsync, isPending: creating } = useCreateShift();
  const { mutate: patchShift } = usePatchShift();

  const allShifts = useMemo(() => (data?.shifts ?? []) as unknown as Array<{
    id: string; title: string; exam_date: string; shift_number: number;
    start_time: string; end_time: string; venue: string; status: string;
    confirmed_count: number; max_employees: number; min_employees: number;
    pay_amount: number;
  }>, [data]);

  const shiftsForDate = useMemo(
    () => allShifts.filter(s => s.exam_date === selectedDate),
    [allShifts, selectedDate]
  );

  const openCreate = useCallback(() => {
    setForm(prev => ({ ...EMPTY_MULTI_FORM, examDate: selectedDate, shifts: [{ ...EMPTY_SHIFT, shiftNumber: shiftsForDate.length + 1 }] }));
    setShowCreate(true);
  }, [selectedDate, shiftsForDate.length]);

  const handleCreate = async () => {
    if (!form.title || !form.venue) { toast.error("Title and venue required"); return; }
    if (form.shifts.length === 0) { toast.error("At least one shift is required"); return; }
    
    let successCount = 0;
    for (const shift of form.shifts) {
      try {
        await createShiftAsync({ ...form, ...shift, examDate: form.examDate || selectedDate });
        successCount++;
      } catch (e: any) {
        toast.error(`Shift ${shift.shiftNumber} failed: ${e.message}`);
      }
    }
    if (successCount > 0) {
      toast.success(`${successCount} Shift(s) created ✓`);
      setShowCreate(false);
      setForm({ ...EMPTY_MULTI_FORM, examDate: selectedDate, shifts: [{ ...EMPTY_SHIFT, shiftNumber: shiftsForDate.length + successCount + 1 }] });
      refetch();
    }
  };

  const handlePublish  = (id: string) => patchShift({ shiftId: id, action: "publish" }, { onSuccess: () => { toast.success("Published ✓ — All employees notified"); refetch(); } });
  const handleComplete = (id: string) => {
    patchShift({ shiftId: id, action: "complete" }, { onSuccess: () => { toast.success("Marked complete ✓"); setConfirmingComplete(null); } });
  };
  const handleCancel = (id: string) => {
    patchShift({ shiftId: id, action: "cancel" }, { onSuccess: () => { toast.success("Cancelled"); setConfirmingCancel(null); } });
  };

  const statusColors: Record<string, { bg: string; fg: string }> = {
    draft:     { bg: "color-mix(in srgb, var(--tc-primary) 12%, transparent)", fg: "var(--tc-primary)" },
    published: { bg: "rgba(16,185,129,0.15)", fg: "#34d399" },
    completed: { bg: "color-mix(in srgb, var(--tc-accent) 12%, transparent)",  fg: "var(--tc-accent)" },
    cancelled: { bg: "rgba(239,68,68,0.14)", fg: "#f87171" },
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 15px", borderRadius: 14, fontSize: 13,
    background: g.inputBg, border: `1px solid ${g.inputBorder}`,
    color: textMain, outline: "none", fontFamily: "var(--font-outfit,'Outfit',sans-serif)",
    transition: "border-color 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s cubic-bezier(0.4,0,0.2,1), background 0.22s cubic-bezier(0.4,0,0.2,1)",
    boxSizing: "border-box",
    boxShadow: dark ? "inset 0 1px 0 rgba(255,255,255,0.05)" : "inset 0 1px 0 rgba(255,255,255,0.80)",
  };
  const inpFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--tc-primary)";
    e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 20%, transparent)";
    e.target.style.background = dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.95)";
  };
  const inpBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = g.inputBorder;
    e.target.style.boxShadow = "none";
    e.target.style.background = g.inputBg;
  };

  const createModalContent = (
    <AnimatePresence>
      {showCreate && (
        <>
          <motion.div
            key="shift-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            style={{ position: "fixed", inset: 0, zIndex: 9990, backdropFilter: "blur(8px) saturate(120%)", WebkitBackdropFilter: "blur(8px) saturate(120%)", background: dark ? "rgba(3,2,10,0.60)" : "rgba(15,8,30,0.22)" }}
            onClick={() => setShowCreate(false)}
          />

          <motion.div
            key="shift-modal-container"
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
              pointerEvents: "none",
            }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(3px)" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              style={{
                pointerEvents: "auto",
                width: "100%", maxWidth: 540,
                maxHeight: "88vh", overflowY: "auto",
                borderRadius: 28,
                background: "var(--spatial-glass-bg)",
                backdropFilter: "var(--spatial-glass-blur)",
                display: "flex", flexDirection: "column", overflow: "hidden",
                position: "relative",
              }}>
              <div
                className="glass-panel-strong admin-panel"
                style={{
                  display: "flex", flexDirection: "column", overflow: "hidden",
                  padding: "0 0 32px",
                }}>
                <div style={{ height: 3, borderRadius: "28px 28px 0 0", background: "linear-gradient(90deg, var(--tc-primary), var(--tc-secondary), var(--tc-accent), var(--tc-secondary), var(--tc-primary))", backgroundSize: "200% 100%", animation: "gradientSlide 4s linear infinite" }} />

                <div style={{ padding: "22px 26px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${g.innerBorder}` }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: textMain, marginBottom: 3 }}>New Shift</h3>
                    <p style={{ fontSize: 12, color: "var(--tc-primary)", fontWeight: 600, letterSpacing: 0.2 }}>Manual Configuration</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCreate(false)}
                    style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={14} />
                  </motion.button>
                </div>

                <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Exam Date</label>
                    <input type="date" value={form.examDate} min={todayStr()} onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))} style={{ ...inp, colorScheme: dark ? "dark" : "light" }} onFocus={inpFocus} onBlur={inpBlur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Exam Title</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. GATE 2026" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Venue</label>
                    <input value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} placeholder="e.g. CIT Bangalore" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {form.shifts.map((shift, idx) => (
                      <div key={idx} style={{ padding: 16, borderRadius: 16, background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${g.inputBorder}`, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tc-primary)", textTransform: "uppercase", letterSpacing: 1 }}>Shift {shift.shiftNumber}</span>
                          {form.shifts.length > 1 && (
                            <button onClick={() => setForm(p => ({ ...p, shifts: p.shifts.filter((_, i) => i !== idx) }))} style={{ border: "none", background: "none", cursor: "pointer", color: "#EF4444" }}><X size={14} /></button>
                          )}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                          <input type="number" value={shift.shiftNumber} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].shiftNumber=+v; return {...p, shifts:s}; }) }} style={inp} placeholder="Shift #" />
                          <input type="time" value={shift.startTime} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].startTime=v; return {...p, shifts:s}; }) }} style={inp} />
                          <input type="time" value={shift.endTime} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].endTime=v; return {...p, shifts:s}; }) }} style={inp} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <input type="number" min={1} value={shift.maxEmployees} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].maxEmployees=+v; return {...p, shifts:s}; }) }} style={inp} placeholder="Staff" />
                          <input type="number" min={0} value={shift.payAmount} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].payAmount=+v; return {...p, shifts:s}; }) }} style={inp} placeholder="Pay (₹)" />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setForm(p => ({ ...p, shifts: [...p.shifts, { ...EMPTY_SHIFT, shiftNumber: p.shifts.length+1 }] }))} style={{ padding: 10, borderRadius: 12, border: "1px dashed #444", color: "var(--tc-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Another Shift</button>
                  </div>
                </div>

                <div style={{ padding: "14px 26px 18px", borderTop: `1px solid ${g.innerBorder}` }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={creating || !form.title || !form.venue} style={{ width: "100%", padding: "14px", borderRadius: 16, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", fontWeight: 700, opacity: creating ? 0.5 : 1 }}>
                    {creating ? "Creating..." : "Create Shift"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: textMain, marginBottom: 4 }}>Exam Shifts</h1>
        <p style={{ fontSize: 13, color: textMuted }}>Manage exam shifts by date for TCS iON</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <motion.button onClick={() => { const d = addDays(selectedDate, -1); setSelectedDate(d); setDateInput(d); }} style={{ width: 40, height: 40, borderRadius: 12, background: cardBg, border: `1px solid ${borderCol}`, cursor: "pointer", color: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={16} /></motion.button>
        <div style={{ position: "relative" }} onClick={() => setShowDatePicker(!showDatePicker)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 14, background: cardBg, border: `1px solid ${borderCol}`, cursor: "pointer" }}>
            <CalendarIcon size={15} style={{ color: "var(--tc-primary)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: textMain }}>{prettyDate(selectedDate)}</span>
          </div>
          <AnimatePresence>
            {showDatePicker && (
              <div className="absolute top-full left-0 z-[100]">
                <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setShowDatePicker(false); }} />
                <div className="relative z-10">
                  <GlassCalendar selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setDateInput(d); setShowDatePicker(false); }} onClose={() => setShowDatePicker(false)} />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
        <motion.button onClick={() => { const d = addDays(selectedDate, 1); setSelectedDate(d); setDateInput(d); }} style={{ width: 40, height: 40, borderRadius: 12, background: cardBg, border: `1px solid ${borderCol}`, cursor: "pointer", color: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={16} /></motion.button>
        <motion.button onClick={() => { setSelectedDate(todayStr()); setDateInput(todayStr()); }} style={{ padding: "9px 16px", borderRadius: 12, background: cardBg, border: `1px solid ${borderCol}`, cursor: "pointer", fontSize: 12, fontWeight: 700, color: textMuted }}>Today</motion.button>
        <button onClick={openCreate} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 12, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Add Shift
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: textMuted }}>Loading shifts...</div>
      ) : shiftsForDate.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", background: cardBg, borderRadius: 32, border: `1px solid ${borderCol}` }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: textMain, marginBottom: 8 }}>No shifts scheduled</p>
          <button onClick={openCreate} style={{ padding: "12px 32px", borderRadius: 16, background: "var(--tc-primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>+ Add First Shift</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
          {shiftsForDate.map(s => (
            <div key={s.id} onClick={() => setShiftDetails(s)} style={{ borderRadius: 24, padding: 22, background: "var(--spatial-glass-bg)", border: "var(--spatial-glass-border)", backdropFilter: "var(--spatial-glass-blur)", boxShadow: "var(--spatial-glass-shadow)", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>SHIFT {s.shift_number}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, ...(statusColors[s.status] || statusColors.draft) }}>{s.status}</span>
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: textMain, marginBottom: 4 }}>{s.title}</h3>
              <p style={{ fontSize: 12, color: textMuted }}>{s.start_time} – {s.end_time}</p>
              <p style={{ fontSize: 12, color: textMuted }}>{s.venue}</p>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {shiftDetails && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 60, backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.5)" }} onClick={() => setShiftDetails(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 61, background: "#fff", padding: 24, borderRadius: 24, width: "90%", maxWidth: 400 }}>
              <h3 style={{ marginBottom: 8 }}>{shiftDetails.title}</h3>
              <button onClick={() => setShiftDetails(null)}>Close</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {mounted && createPortal(createModalContent, document.body)}
    </div>
  );
}
