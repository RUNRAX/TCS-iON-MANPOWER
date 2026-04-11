"use client";
import React, { useState, useMemo, useCallback } from "react";
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
  // UTC today — avoids IST/timezone drift where local midnight != UTC midnight
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
function addDays(s: string, n: number) {
  // Use UTC parts to avoid timezone-offset date drift
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

  // ── Date picker state ─────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState(selectedDate);

  // ── Create modal state ────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(0); // 0=AI, 1=Manual
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_MULTI_FORM, examDate: selectedDate });

  // ── Status filter ─────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Inline Confirmation States ───────────────────────────────────────────
  const [confirmingComplete, setConfirmingComplete] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);

  // ── Details Modal State ──────────────────────────────────────────────────
  const [shiftDetails, setShiftDetails] = useState<any>(null);

  const { data, isLoading, refetch } = useAdminShifts({ status: statusFilter === "all" ? undefined : statusFilter });
  const { mutateAsync: createShiftAsync, isPending: creating } = useCreateShift();
  const { mutate: patchShift } = usePatchShift();

  // Filter shifts by selected date
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
    setStep(0);
    setAiText("");
    setShowCreate(true);
  }, [selectedDate, shiftsForDate.length]);

  const handleAIFill = useCallback(async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/parse-shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiText, date: selectedDate }),
      });
      
      let json: { status: string; message: string; data: any } = { status: "error", message: "Parsing failed", data: null };
      try {
        json = await res.json();
      } catch (err) {
        // Handle case where server responds with non-JSON (e.g. 503 HTML from Vercel)
      }

      if (json.status === "ok" && json.data) {
        toast.success("AI auto-filled fields ✨");
        setForm(prev => ({ ...prev, ...json.data }));
        setStep(1);
      } else if (res.status === 429 || res.status === 503 || (json.message || "").toLowerCase().includes("quota")) {
        toast.error("AI system is currently busy (Quota Exceeded). Falling back to manual entry.");
        setStep(1);
      } else {
        toast.error(json.message || "Parsing failed");
      }
    } catch {
      toast.error("Network error — try again");
    }
    setAiLoading(false);
  }, [aiText, selectedDate]);

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

  return (
    <div className="p-4 md:p-6 lg:p-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: textMain, marginBottom: 4 }}>Exam Shifts</h1>
        <p style={{ fontSize: 13, color: textMuted }}>Manage exam shifts by date for TCS iON</p>
      </div>

      {/* ── Date picker bar ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {/* Prev / Next day */}
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
          onClick={() => { const d = addDays(selectedDate, -1); setSelectedDate(d); setDateInput(d); }}
          style={{ width: 40, height: 40, borderRadius: 12, background: cardBg, border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.85)"}`, cursor: "pointer", color: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: g.blur, WebkitBackdropFilter: g.blur, boxShadow: dark ? "inset 0 1px 0 rgba(255,255,255,0.09)" : "inset 0 1px 0 rgba(255,255,255,0.95)", transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
          <ChevronLeft size={16} />
        </motion.button>

        {/* Date display — click to open custom GlassCalendar */}
        <div style={{ position: "relative" }}>
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 14, 
              background: cardBg, border: `1px solid ${borderCol}`, cursor: "pointer", 
              backdropFilter: "blur(32px) saturate(210%)", WebkitBackdropFilter: "blur(32px) saturate(210%)",
              boxShadow: dark ? "0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" : "0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)",
              transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)" 
            }}
            onClick={() => setShowDatePicker(!showDatePicker)}>
            <CalendarIcon size={15} style={{ color: "var(--tc-primary)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: textMain }}>
              {prettyDate(selectedDate)}
            </span>
          </motion.div>

          <AnimatePresence>
            {showDatePicker && (
              <div className="absolute top-full left-0 z-[100]">
                {/* Click away overlay */}
                <div className="fixed inset-0" onClick={() => setShowDatePicker(false)} />
                <GlassCalendar 
                  selectedDate={selectedDate} 
                  onSelect={(d) => { setSelectedDate(d); setDateInput(d); setShowDatePicker(false); }}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
          onClick={() => { const d = addDays(selectedDate, 1); setSelectedDate(d); setDateInput(d); }}
          style={{ width: 40, height: 40, borderRadius: 12, background: cardBg, border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.85)"}`, cursor: "pointer", color: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: g.blur, WebkitBackdropFilter: g.blur, boxShadow: dark ? "inset 0 1px 0 rgba(255,255,255,0.09)" : "inset 0 1px 0 rgba(255,255,255,0.95)", transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
          <ChevronRight size={16} />
        </motion.button>

        {/* Today shortcut */}
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => { setSelectedDate(todayStr()); setDateInput(todayStr()); }}
          style={{ padding: "9px 16px", borderRadius: 12, background: selectedDate === todayStr() ? "color-mix(in srgb, var(--tc-primary) 20%, transparent)" : cardBg, border: `1px solid ${selectedDate === todayStr() ? "var(--tc-primary)" : (dark ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.85)")}`, cursor: "pointer", fontSize: 12, fontWeight: 700, color: selectedDate === todayStr() ? "var(--tc-primary)" : textMuted, transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)", backdropFilter: g.blur, WebkitBackdropFilter: g.blur, boxShadow: selectedDate === todayStr() ? "0 0 0 1px color-mix(in srgb, var(--tc-primary) 20%, transparent)" : dark ? "inset 0 1px 0 rgba(255,255,255,0.07)" : "inset 0 1px 0 rgba(255,255,255,0.90)" }}>
          Today
        </motion.button>

        {/* Status filter */}
        <div style={{ display: "flex", gap: 4, marginLeft: "auto", padding: 4, borderRadius: 14, background: cardBg, border: `1px solid ${dark ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.85)"}`, backdropFilter: g.blur, WebkitBackdropFilter: g.blur, boxShadow: dark ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 16px rgba(0,0,0,0.18)" : "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.05)" }}>
          {["all","draft","published","completed","cancelled"].map(tab => (
            <button key={tab} onClick={() => setStatusFilter(tab)}
              style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: statusFilter === tab ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" : "transparent", color: statusFilter === tab ? "#fff" : textMuted, textTransform: "capitalize", transition: "all 0.2s" }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Add shift for this date */}
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 8px 24px color-mix(in srgb, var(--tc-primary) 35%, transparent)" }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 12, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px color-mix(in srgb, var(--tc-primary) 30%, transparent)", transition: "box-shadow 0.25s" }}>
          <Plus size={15} /> Add Shift
        </motion.button>
      </div>

      {/* ── Shifts for selected date ────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {Array(4).fill(0).map((_, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              style={{ height: 188, borderRadius: 24, overflow: "hidden", position: "relative",
                background: dark ? "rgba(14,11,32,0.70)" : "rgba(255,255,255,0.75)",
                border: `1px solid ${g.cardBorder}`,
                backdropFilter: g.blur, WebkitBackdropFilter: g.blur,
              }}>
              <div className="skeleton" style={{ position: "absolute", inset: 0 }} />
            </motion.div>
          ))}
        </div>
      ) : shiftsForDate.length === 0 && !isLoading ? (
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5, scale: 1.01 }}
          style={{ 
            textAlign: "center", padding: "64px 24px", 
            background: cardBg, borderRadius: 32, border: `1px solid ${borderCol}`,
            backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
            boxShadow: dark ? "0 40px 100px rgba(0,0,0,0.3)" : "0 20px 50px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#818cf8", boxShadow: "0 12px 24px rgba(99,102,241,0.2)" }}>
            <CalendarIcon size={32} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: textMain, marginBottom: 8 }}>No shifts scheduled</p>
          <p style={{ fontSize: 13, color: textMuted, marginBottom: 24, maxWidth: 300, marginInline: "auto" }}>This date is currently clear. Add a new exam shift to start scheduling staff.</p>
          <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            style={{ padding: "12px 32px", borderRadius: 16, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px color-mix(in srgb, var(--tc-primary) 30%, transparent)" }}>
            <Plus size={16} /> Add First Shift
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20, perspective: "1500px" }}>
          <AnimatePresence>
            {shiftsForDate.map((s, i) => {
              const sc = statusColors[s.status] ?? statusColors.draft;
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 20, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.94, filter: "blur(2px)" }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 360, damping: 28 }}
                  whileHover={{ 
                    y: -10, 
                    scale: 1.05, 
                    z: 40,
                    boxShadow: dark 
                      ? "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)" 
                      : "0 20px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)"
                  }}
                  style={{ borderRadius: 24, padding: 22, background: "var(--spatial-glass-bg)", border: "var(--spatial-glass-border)", backdropFilter: "var(--spatial-glass-blur)", WebkitBackdropFilter: "var(--spatial-glass-blur)", boxShadow: "var(--spatial-glass-shadow)", position: "relative", overflow: "hidden", cursor: "pointer", transformStyle: "preserve-3d", willChange: "transform, opacity", transform: "translateZ(0)" }}>
                  {/* Pop-up internal highlight */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  {/* Card inner glow */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", borderRadius: "24px 24px 0 0" }} />
                  
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 13, background: "color-mix(in srgb, var(--tc-primary) 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tc-primary)" }}>
                      <CalendarDays size={18} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>SHIFT {s.shift_number}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, ...sc }}>{s.status}</span>
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: 15, color: textMain, marginBottom: 4, lineHeight: 1.3 }}>{s.title}</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: textMuted }}>
                      <Clock size={12} />{s.start_time} – {s.end_time}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: textMuted }}>
                      <MapPin size={12} />{s.venue}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                      <Users size={12} style={{ color: textMuted }} />
                      <span style={{ color: s.confirmed_count >= s.min_employees ? "#34d399" : textMuted }}>
                        {s.confirmed_count}/{s.max_employees} confirmed
                      </span>
                    </div>
                  </div>

                  {(s.status === "draft" || s.status === "published") && (
                    <div style={{ position: "relative", height: 34, marginTop: 4 }}>
                      <AnimatePresence mode="wait">
                        {confirmingComplete === s.id ? (
                          <motion.div key="confirm-complete"
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            style={{ display: "flex", gap: 8, position: "absolute", inset: 0 }}>
                            <button onClick={() => setConfirmingComplete(null)}
                              style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: cardBg, border: `1px solid ${borderCol}`, color: textMain, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                              Back
                            </button>
                            <button onClick={() => handleComplete(s.id)}
                              style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                              <CheckCircle size={12} /> Confirm
                            </button>
                          </motion.div>
                        ) : confirmingCancel === s.id ? (
                          <motion.div key="confirm-cancel"
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            style={{ display: "flex", gap: 8, position: "absolute", inset: 0 }}>
                            <button onClick={() => setConfirmingCancel(null)}
                              style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: cardBg, border: `1px solid ${borderCol}`, color: textMain, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                              Keep
                            </button>
                            <button onClick={() => handleCancel(s.id)}
                              style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                              <XCircle size={12} /> Delete
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div key="actions"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            style={{ display: "flex", gap: 8, position: "absolute", inset: 0 }}>
                            {s.status === "draft" && (
                              <button onClick={() => handlePublish(s.id)}
                                style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                Publish
                              </button>
                            )}
                            {s.status === "published" && (
                              <button onClick={() => setConfirmingComplete(s.id)}
                                style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                                <CheckCircle size={12} /> Complete
                              </button>
                            )}
                            <button onClick={() => setConfirmingCancel(s.id)}
                              style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                              <XCircle size={12} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── All Shifts Table ─────────────────────────────────────────────────── */}
      {statusFilter !== "all" || allShifts.length > 0 ? (
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Shift Directory</p>
          <div style={{
            background: cardBg, borderRadius: 20, overflow: "hidden",
            border: `1px solid ${borderCol}`, backdropFilter: g.blur, WebkitBackdropFilter: g.blur,
            boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.2)" : "0 4px 16px rgba(0,0,0,0.04)"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderBottom: `1px solid ${borderCol}` }}>
                    {["Date", "Title", "Venue", "Time", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ fontSize: 13, color: textMain }}>
                  {allShifts.slice().sort((a,b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()).map(s => {
                    const sc = statusColors[s.status] ?? statusColors.draft;
                    return (
                      <tr key={s.id}
                        onClick={() => setShiftDetails(s)}
                        style={{ borderBottom: `1px solid ${borderCol}`, cursor: "pointer", transition: "background 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 600 }}>{s.exam_date}</span>
                          <span style={{ display: "block", fontSize: 11, color: textMuted }}>Shift {s.shift_number}</span>
                        </td>
                        <td style={{ padding: "14px 18px", fontWeight: 600 }}>{s.title}</td>
                        <td style={{ padding: "14px 18px", color: textMuted }}>{s.venue}</td>
                        <td style={{ padding: "14px 18px", color: textMuted }}>{s.start_time}-{s.end_time}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, ...sc }}>{s.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {allShifts.length === 0 && (
                <div style={{ padding: 30, textAlign: "center", color: textMuted, fontSize: 13 }}>No shifts found</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Shift Details Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {shiftDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: "fixed", inset: 0, zIndex: 60, backdropFilter: "blur(12px) saturate(120%)", background: dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)" }}
              onClick={() => setShiftDetails(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              style={{
                position: "fixed", top: "50%", left: "50%", zIndex: 61,
                transform: "translate(-50%, -50%)", width: "100%", maxWidth: 440,
                background: "var(--spatial-glass-bg)", border: "var(--spatial-glass-border)",
                borderRadius: 24, padding: "0 0 24px", overflow: "hidden",
                backdropFilter: "var(--spatial-glass-blur)", boxShadow: "var(--spatial-glass-shadow)"
              }}>
              <div style={{ height: 4, background: "linear-gradient(90deg, var(--tc-primary), var(--tc-secondary))" }} />
              <div style={{ padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${borderCol}` }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: textMain, marginBottom: 4 }}>{shiftDetails.title}</h3>
                  <p style={{ fontSize: 13, color: textMuted }}>Shift {shiftDetails.shift_number} · {prettyDate(shiftDetails.exam_date)}</p>
                </div>
                <button onClick={() => setShiftDetails(null)} style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>
              
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Status", value: <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, ...(statusColors[shiftDetails.status] ?? statusColors.draft) }}>{shiftDetails.status}</span> },
                  { label: "Time", value: `${shiftDetails.start_time} – ${shiftDetails.end_time}` },
                  { label: "Venue", value: shiftDetails.venue },
                  { label: "Pay Amount", value: `₹${shiftDetails.pay_amount}` },
                  { label: "Confirmed Staff", value: `${shiftDetails.confirmed_count} / ${shiftDetails.max_employees}`, highlight: shiftDetails.confirmed_count >= shiftDetails.min_employees }
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: row.highlight ? "#34d399" : textMain }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "0 24px" }}>
                <button onClick={() => setShiftDetails(null)} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "var(--tc-primary)", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── iOS 26 Glass Create Shift Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              style={{ position: "fixed", inset: 0, zIndex: 50, backdropFilter: "blur(32px) saturate(180%)", WebkitBackdropFilter: "blur(32px) saturate(180%)", background: dark ? "rgba(3,2,10,0.60)" : "rgba(15,8,30,0.22)" }}
              onClick={() => setShowCreate(false)}
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(3px)" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              style={{
                position: "fixed", inset: 0, zIndex: 51,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
                pointerEvents: "none",
              }}>
              <div style={{
                pointerEvents: "all",
                width: "100%", maxWidth: 500,
                maxHeight: "92vh", overflowY: "auto",
                borderRadius: 36,
                background: g.bg,
                backdropFilter: g.blur,
                WebkitBackdropFilter: g.blur,
                border: `1px solid ${g.border}`,
                boxShadow: g.shadow,
                padding: "0 0 32px",
                position: "relative",
              }}>
                {/* Prismatic inner glow */}
                <div style={{ position: "absolute", inset: 0, borderRadius: 36, pointerEvents: "none", background: dark ? "radial-gradient(ellipse at 30% 0%, rgba(99,102,241,0.10) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.08) 0%, transparent 55%)" : "radial-gradient(ellipse at 30% 0%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.04) 0%, transparent 55%)" }} />
                {/* Gradient top bar */}
                <div style={{ height: 3, borderRadius: "36px 36px 0 0", background: "linear-gradient(90deg, var(--tc-primary), var(--tc-secondary), var(--tc-accent), var(--tc-secondary), var(--tc-primary))", backgroundSize: "200% 100%", animation: "gradientSlide 4s linear infinite" }} />

                {/* Header */}
                <div style={{ padding: "22px 26px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${g.innerBorder}` }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: textMain, marginBottom: 3 }}>New Shift</h3>
                    <p style={{ fontSize: 12, color: "var(--tc-primary)", fontWeight: 600, letterSpacing: 0.2 }}>
                      {step === 0 ? "AI Configuration" : "Manual Configuration"}
                    </p>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCreate(false)}
                    style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    <X size={14} />
                  </motion.button>
                </div>

                {/* Step indicator */}
                <div style={{ padding: "8px 24px", display: "flex", gap: 6, flexShrink: 0 }}>
                  {["AI Fill", "Manual Configuration"].map((s, i) => (
                    <div key={s} style={{
                      flex: 1, height: 4, borderRadius: 99,
                      background: i <= step
                        ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))"
                        : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      transition: "all 0.18s ease",
                    }} />
                  ))}
                </div>

                {/* Form */}
                <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div key="ai" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                        <div className="admin-panel" style={{ position: "relative", borderRadius: 18, padding: 20, marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                              <Sparkles size={17} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 14, color: textMain }}>AI Auto-Fill ✨</p>
                              <p style={{ fontSize: 11, color: textMuted }}>Paste the shift details below</p>
                            </div>
                          </div>
                          <textarea
                            value={aiText}
                            onChange={e => setAiText(e.target.value)}
                            placeholder="Paste the shift details here, e.g.: Date: 15 April 2026, Venue: TCS Gitam, Start: 09:00 AM, End: 05:00 PM, Pay: 800"
                            rows={8}
                            style={{
                              width: "100%", padding: "12px 14px", borderRadius: 14,
                              background: g.inputBg, border: `1px solid ${g.inputBorder}`,
                              color: textMain, fontSize: 13, outline: "none", resize: "none",
                              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', sans-serif",
                              lineHeight: 1.5, boxSizing: "border-box",
                              transition: "border-color 0.22s, box-shadow 0.22s",
                            }}
                            onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 15%, transparent)"; }}
                            onBlur={e => { e.target.style.borderColor = g.inputBorder; e.target.style.boxShadow = "none"; }}
                          />
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={handleAIFill}
                            disabled={aiLoading || !aiText.trim()}
                            style={{
                              width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 14,
                              background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                              border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
                              cursor: aiLoading || !aiText.trim() ? "not-allowed" : "pointer",
                              opacity: aiLoading || !aiText.trim() ? 0.6 : 1,
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                              boxShadow: "0 6px 20px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                              transition: "opacity 0.2s",
                            }}
                          >
                            {aiLoading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Parsing with AI…</> : <><Wand2 size={15} /> AI Auto-Fill</>}
                          </motion.button>
                        </div>

                        <div style={{ textAlign: "center", color: textMuted, fontSize: 12, marginBottom: 12 }}>— or —</div>

                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setStep(1)}
                          style={{
                            width: "100%", padding: "12px 0", borderRadius: 14,
                            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            border: `1px solid ${borderCol}`, color: textMain, fontSize: 13, fontWeight: 600,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "all 0.2s",
                          }}
                        >
                          <FileText size={14} /> Fill Manually <ArrowRight size={14} />
                        </motion.button>
                      </motion.div>
                    )}

                    {step === 1 && (
                      <motion.div key="manual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }} style={{display: 'flex', flexDirection: 'column', gap: 16}}>

                  {/* Exam Date — shown & editable, defaults to selectedDate */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Exam Date</label>
                    <input
                      type="date"
                      value={form.examDate}
                      min={todayStr()}
                      onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))}
                      style={{ ...inp, colorScheme: dark ? "dark" : "light" }}
                      onFocus={inpFocus}
                      onBlur={inpBlur}
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Exam Title</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. GATE 2026" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                  </div>

                  {/* Venue */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Venue</label>
                    <input value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} placeholder="e.g. CIT Bangalore" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                  </div>

                  {/* Multi-Shift Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {form.shifts.map((shift, idx) => (
                      <div key={idx} style={{ padding: 16, borderRadius: 16, background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${g.inputBorder}`, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tc-primary)", textTransform: "uppercase", letterSpacing: 1 }}>Shift {shift.shiftNumber} Configuration</span>
                          {form.shifts.length > 1 && (
                            <button onClick={() => setForm(p => ({ ...p, shifts: p.shifts.filter((_, i) => i !== idx) }))} style={{ border: "none", background: "none", cursor: "pointer", color: "#EF4444" }}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        
                        {/* Shift number & Times */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Shift Number</label>
                            <input type="number" min={1} value={shift.shiftNumber} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].shiftNumber=+v; return {...p, shifts:s}; }) }} style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Start Time</label>
                            <input type="time" value={shift.startTime} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].startTime=v; return {...p, shifts:s}; }) }} style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>End Time</label>
                            <input type="time" value={shift.endTime} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].endTime=v; return {...p, shifts:s}; }) }} style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                          </div>
                        </div>

                        {/* Staff, Pay & Notes */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Max Staff</label>
                            <input type="number" min={1} value={shift.maxEmployees} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].maxEmployees=+v; return {...p, shifts:s}; }) }} style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Pay (₹)</label>
                            <input type="number" min={0} value={shift.payAmount} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].payAmount=+v; return {...p, shifts:s}; }) }} style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Notes (optional)</label>
                          <textarea rows={1} value={shift.notes} onChange={e => { const v=e.target.value; setForm(p => { const s=[...p.shifts]; s[idx].notes=v; return {...p, shifts:s}; }) }} placeholder="Additional instructions…" style={{ ...inp, resize: "none", padding: "8px 12px", minHeight: 36 }} onFocus={inpFocus} onBlur={inpBlur} />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setForm(p => {
                        const last = p.shifts.length > 0 ? p.shifts[p.shifts.length - 1] : EMPTY_SHIFT;
                        const nextNum = last.shiftNumber + 1;
                        let nextStart = last.endTime;
                        if (!nextStart) nextStart = "14:00";
                        return { ...p, shifts: [...p.shifts, { ...EMPTY_SHIFT, shiftNumber: nextNum, startTime: nextStart, endTime: "18:00" }] };
                      })}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 12, background: dark ? "rgba(79,158,255,0.08)" : "rgba(79,158,255,0.1)", border: `1px dashed rgba(79,158,255,0.4)`, color: "var(--tc-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                    >
                      <Plus size={14} /> Add Another Shift
                    </button>
                  </div>

                  {/* Submit from form was removed here, it is in the footer below */}
                  </motion.div>
                    )}
                  </AnimatePresence>
                </div> {/* End of form scrollable area */}

                {/* Footer Navigation */}
                {step === 1 && (
                  <div style={{ padding: "14px 26px 18px", borderTop: `1px solid ${g.innerBorder}`, display: "flex", gap: 10, flexShrink: 0 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setStep(0)}
                      style={{
                        flex: 1, padding: "12px 0", borderRadius: 12,
                        background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${borderCol}`, color: textMain, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <ArrowLeft size={14} /> Back
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 12px 36px color-mix(in srgb, var(--tc-primary) 45%, transparent)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleCreate}
                      disabled={creating || !form.title || !form.venue}
                      style={{
                        flex: 2, padding: "14px 0", borderRadius: 16,
                        background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                        border: "none", color: "#fff", cursor: creating || !form.title || !form.venue ? "not-allowed" : "pointer",
                        fontSize: 15, fontWeight: 700, letterSpacing: 0.3,
                        opacity: creating || !form.title || !form.venue ? 0.55 : 1,
                        boxShadow: "0 6px 24px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                        transition: "opacity 0.2s, box-shadow 0.25s",
                      }}>
                      {creating
                        ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />Creating…</>
                        : <><CheckCircle size={16} />Create Shift</>}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
