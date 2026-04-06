"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAdminShifts } from "@/hooks/use-api";
import { Send, Clock, ChevronDown, Check, Zap, Users, Radio, Mail, MessageCircle, Wallet, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

// ── Custom glass dropdown ─────────────────────────────────────────────────────
function GlassSelect({
  value, onChange, options, placeholder, dark, textMain, textMuted,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; sub?: string }[];
  placeholder: string;
  dark: boolean;
  textMain: string;
  textMuted: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const glassBg    = dark ? "rgba(10, 8, 26, 0.88)" : "rgba(252,251,255,0.35)";
  const glassBlur  = "blur(72px) saturate(210%) brightness(1.06)";
  const borderCol  = dark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.90)";
  const shadowDrop = dark
    ? "0 32px 80px rgba(0,0,0,0.58), 0 8px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.13)"
    : "0 16px 48px rgba(0,0,0,0.11), 0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.98)";

  return (
    <div ref={ref} style={{ position: "relative", zIndex: open ? 100 : 1 }}>
      <motion.button
        whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.998 }}
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 16px", borderRadius: 16, cursor: "pointer",
          background: dark ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${open ? "var(--tc-primary)" : borderCol}`,
          boxShadow: open
            ? "0 0 0 3px color-mix(in srgb, var(--tc-primary) 18%, transparent)"
            : dark ? "inset 0 1px 0 rgba(255,255,255,0.07)" : "inset 0 1px 0 rgba(255,255,255,0.85)",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)", outline: "none",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? textMain : textMuted }}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}
          style={{ color: "var(--tc-primary)", display: "flex" }}>
          <ChevronDown size={16} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, scale: 0.97, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.75 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
              borderRadius: 20, background: glassBg,
              backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur,
              border: `1px solid ${borderCol}`, boxShadow: shadowDrop,
              overflow: "hidden", zIndex: 200,
            }}
          >
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }} />
            <div style={{ padding: 6, maxHeight: 300, overflowY: "auto" }}>
              {options.length === 0 && (
                <div style={{ padding: "16px", fontSize: 13, color: textMuted, textAlign: "center" }}>
                  No published shifts found
                </div>
              )}
              {options.map((opt, i) => {
                const isActive = opt.value === value;
                return (
                  <motion.button
                    key={opt.value}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.18 }}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 13, cursor: "pointer", border: "none", textAlign: "left",
                      background: isActive
                        ? "linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 20%, transparent), color-mix(in srgb, var(--tc-secondary) 14%, transparent))"
                        : "transparent",
                      transition: "background 0.18s cubic-bezier(0.4,0,0.2,1)",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--tc-primary)" : textMain, marginBottom: opt.sub ? 2 : 0 }}>
                        {opt.label}
                      </p>
                      {opt.sub && <p style={{ fontSize: 11, color: textMuted }}>{opt.sub}</p>}
                    </div>
                    {isActive && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 28 }}
                        style={{ color: "var(--tc-primary)", display: "flex", flexShrink: 0 }}>
                        <Check size={14} />
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminBroadcast() {
  const { dark } = useTheme();
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.52)" : "rgba(30,20,80,0.45)";
  const inputBg      = dark ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.03)";
  const inputBorder  = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.09)";
  const border       = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  // Mobile detection for compact layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { data, isLoading } = useAdminShifts({ status: "published" });
  const [selectedShift, setSelectedShift] = useState("");
  const [targetGroup, setTargetGroup]     = useState("all");
  const [customMsg, setCustomMsg]         = useState("");
  const [sending, setSending]             = useState(false);

  const shifts = (data?.shifts ?? []) as Array<{ id: string; title: string; examDate: string; shiftNumber: number }>;
  const shiftOptions = shifts.map(s => ({ value: s.id, label: s.title, sub: `${s.examDate} · Shift ${s.shiftNumber}` }));

  const targetGroups = [
    { id: "all",         label: "All",         icon: Users,  desc: "Every assigned" },
    { id: "confirmed",   label: "Confirmed",   icon: Check,  desc: "Only confirmed" },
    { id: "unresponded", label: "Unresponded", icon: Clock,  desc: "No response" },
  ];

  const handleSend = async () => {
    if (!selectedShift) { toast.error("Select a shift first"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: selectedShift, targetGroup, customMessage: customMsg || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast.success(`Broadcast sent to ${json.data?.sent ?? "?"} employees ✓`);
      setCustomMsg("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Broadcast failed");
    } finally { setSending(false); }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: isMobile ? "10px 12px" : "13px 16px", borderRadius: isMobile ? 12 : 16, fontSize: isMobile ? 13 : 14,
    background: inputBg, border: `1px solid ${inputBorder}`,
    color: textMain, outline: "none", resize: "none",
    fontFamily: "var(--font-outfit,'Outfit',sans-serif)",
    transition: "border-color 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s cubic-bezier(0.4,0,0.2,1), background 0.22s",
    boxSizing: "border-box",
  };

  // ── Payroll State ────────────────────────────────────────────────────────────
  const [payrollDate, setPayrollDate]   = useState("");
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollShifts, setPayrollShifts]   = useState<Array<{ id: string; title: string; shift_number: number; start_time: string; end_time: string; venue: string }>>([]);
  const [payrollEmployees, setPayrollEmployees] = useState<Array<{ id: string; full_name: string; email: string; phone: string; assignments: Record<string, { duty_role?: string; notes?: string }> }>>([]);
  const [payrollAmounts, setPayrollAmounts] = useState<Record<string, string>>({});
  const [payrollRefs, setPayrollRefs]       = useState<Record<string, string>>({});
  const [sendingPayments, setSendingPayments] = useState<Record<string, boolean>>({});
  const [broadcastingAll, setBroadcastingAll] = useState(false);
  const [selectedPayrollShift, setSelectedPayrollShift] = useState("");

  const fetchPayrollData = async (date: string) => {
    if (!date) return;
    setPayrollLoading(true);
    setPayrollEmployees([]);
    setPayrollShifts([]);
    setPayrollAmounts({});
    setPayrollRefs({});
    setSelectedPayrollShift("");
    try {
      const res = await fetch(`/api/admin/bookings?date=${date}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      const loadedShifts = json.data?.shifts ?? [];
      setPayrollShifts(loadedShifts);
      // Auto-select first shift
      if (loadedShifts.length > 0) setSelectedPayrollShift(loadedShifts[0].id);
      const allEmps = json.data?.employees ?? [];
      // Filter only employees who have an assignment for any shift on this date
      const assignedEmps = allEmps.filter((e: any) =>
        loadedShifts.some((s: any) => e.assignments && e.assignments[s.id] && e.assignments[s.id].duty_role)
      );
      setPayrollEmployees(assignedEmps);
    } catch {
      toast.error("Failed to load attendance data for payroll");
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleSinglePayment = async (empId: string, empName: string) => {
    const amount = parseFloat(payrollAmounts[empId] ?? "");
    if (!amount || amount <= 0) { toast.error(`Enter a valid amount for ${empName}`); return; }
    if (!selectedPayrollShift) { toast.error("Select a shift first"); return; }
    setSendingPayments(prev => ({ ...prev, [empId]: true }));
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empId, shiftId: selectedPayrollShift,
          amountRupees: amount, referenceNumber: payrollRefs[empId] || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Payment failed");
      toast.success(`₹${amount} cleared for ${empName} ✓`);
      setPayrollAmounts(prev => { const n = { ...prev }; delete n[empId]; return n; });
      setPayrollRefs(prev => { const n = { ...prev }; delete n[empId]; return n; });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Payment failed for ${empName}`);
    } finally {
      setSendingPayments(prev => ({ ...prev, [empId]: false }));
    }
  };

  const handleBroadcastAll = async () => {
    if (!selectedPayrollShift) { toast.error("Select a shift first"); return; }
    const entries = payrollEmployees.filter(e => {
      const amt = parseFloat(payrollAmounts[e.id] ?? "");
      return amt > 0;
    });
    if (entries.length === 0) { toast.error("Enter amounts for at least one employee"); return; }
    setBroadcastingAll(true);
    let success = 0;
    let fail = 0;
    for (const emp of entries) {
      try {
        const res = await fetch("/api/admin/payments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: emp.id, shiftId: selectedPayrollShift,
            amountRupees: parseFloat(payrollAmounts[emp.id]),
            referenceNumber: payrollRefs[emp.id] || undefined,
          }),
        });
        if (res.ok) { success++; } else { fail++; }
      } catch { fail++; }
    }
    if (success > 0) toast.success(`${success} payment${success > 1 ? "s" : ""} cleared ✓`);
    if (fail > 0) toast.error(`${fail} payment${fail > 1 ? "s" : ""} failed`);
    setPayrollAmounts({});
    setPayrollRefs({});
    setBroadcastingAll(false);
  };

  // Active employees for the selected payroll shift
  const payrollShiftEmployees = selectedPayrollShift
    ? payrollEmployees.filter(e => e.assignments[selectedPayrollShift]?.duty_role)
    : payrollEmployees;

  return (
    <div style={{ padding: isMobile ? "12px 12px" : "24px 28px", minHeight: "100%", position: "relative" }}>

      {/* Ambient orbs — hidden on mobile for performance */}
      {!isMobile && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--tc-primary) 12%, transparent) 0%, transparent 70%)", filter: "blur(60px)", animation: "orbFloat1 20s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--tc-secondary) 10%, transparent) 0%, transparent 70%)", filter: "blur(60px)", animation: "orbFloat2 25s ease-in-out infinite" }} />
        </div>
      )}

      {/* Header */}
      <div
        style={{ marginBottom: isMobile ? 16 : 32, position: "relative", zIndex: 1 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, marginBottom: 4 }}>
          <div style={{
            width: isMobile ? 36 : 48, height: isMobile ? 36 : 48,
            borderRadius: isMobile ? 12 : 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
            boxShadow: "0 8px 24px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
            flexShrink: 0,
          }}>
            <Mail size={isMobile ? 17 : 22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 18 : 26, fontWeight: 800, color: textMain, letterSpacing: -0.5 }}>Notifications & Payroll</h1>
            <p style={{ fontSize: isMobile ? 11 : 13, color: textMuted, marginTop: 2 }}>Email broadcasts · Manual payment assignment</p>
          </div>
        </div>
      </div>

      {/* ─── EMAIL BROADCAST CARD ─────────────────────────────────────────────── */}
      <div
        className="admin-panel"
        style={{
          maxWidth: 580, position: "relative", zIndex: 1,
          borderRadius: isMobile ? 20 : 28, overflow: "hidden",
          marginBottom: isMobile ? 20 : 32,
        }}
      >
        {/* Top gradient bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--tc-primary), var(--tc-secondary), var(--tc-accent), var(--tc-secondary), var(--tc-primary))", backgroundSize: "200% 100%", animation: "gradientSlide 4s linear infinite" }} />

        {/* Inner prismatic glow */}
        <div style={{ position: "absolute", inset: 0, borderRadius: isMobile ? 20 : 28, pointerEvents: "none", background: dark ? "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.09) 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(139,92,246,0.07) 0%, transparent 50%)" : "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.05) 0%, transparent 55%)" }} />

        <div style={{ padding: isMobile ? "16px 14px 20px" : "28px 28px 32px", position: "relative" }}>
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 14 : 20 }}>
            <Radio size={14} style={{ color: "var(--tc-primary)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: textMuted }}>Email Broadcast</span>
          </div>

          {/* Shift selector */}
          <div style={{ marginBottom: isMobile ? 16 : 24 }}>
            <label style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: textMuted, display: "block", marginBottom: isMobile ? 7 : 10 }}>
              Select Shift
            </label>
            {isLoading ? (
              <div style={{ height: 50, borderRadius: 16, overflow: "hidden" }}><div className="skeleton" style={{ width: "100%", height: "100%" }} /></div>
            ) : (
              <GlassSelect value={selectedShift} onChange={setSelectedShift} options={shiftOptions} placeholder="Choose a published shift…" dark={dark} textMain={textMain} textMuted={textMuted} />
            )}
          </div>

          {/* Target group */}
          <div style={{ marginBottom: isMobile ? 16 : 24 }}>
            <label style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: textMuted, display: "block", marginBottom: isMobile ? 7 : 10 }}>
              Target Group
            </label>
            <div style={{ display: "flex", gap: isMobile ? 6 : 8 }}>
              {targetGroups.map(g => {
                const Icon = g.icon;
                const isActive = targetGroup === g.id;
                return (
                  <button key={g.id}
                    onClick={() => setTargetGroup(g.id)}
                    className="admin-panel"
                    style={{
                      flex: 1, padding: isMobile ? "10px 8px" : "16px 12px",
                      borderRadius: isMobile ? 12 : 16, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 4 : 6,
                      background: isActive ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" : dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isActive ? "transparent" : (dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)")}`,
                      boxShadow: isActive ? "0 6px 20px color-mix(in srgb, var(--tc-primary) 32%, transparent), inset 0 1px 0 rgba(255,255,255,0.20)" : dark ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.80)",
                      transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)",
                    }}>
                    <Icon size={isMobile ? 13 : 15} color={isActive ? "#fff" : "var(--tc-primary)"} />
                    <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: isActive ? "#fff" : textMain }}>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom message */}
          <div style={{ marginBottom: isMobile ? 18 : 28 }}>
            <label style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: textMuted, display: "block", marginBottom: isMobile ? 7 : 10 }}>
              Custom Message <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, opacity: 0.7 }}>(optional)</span>
            </label>
            <textarea rows={isMobile ? 3 : 4} value={customMsg} onChange={e => setCustomMsg(e.target.value)}
              className="admin-panel"
              placeholder="Leave blank to use the default shift notification template…"
              style={inp}
              onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 18%, transparent)"; e.target.style.background = dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.96)"; }}
              onBlur={e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; e.target.style.background = inputBg; }}
            />
            <p style={{ fontSize: 11, color: textMuted, marginTop: isMobile ? 5 : 7, paddingLeft: 2 }}>
              {customMsg.length > 0 ? `${customMsg.length} characters` : "Default email template will be used"}
            </p>
          </div>

          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 14px 40px color-mix(in srgb, var(--tc-primary) 48%, transparent)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            onClick={handleSend} disabled={sending || !selectedShift}
            style={{
              width: "100%", padding: isMobile ? "12px 0" : "15px 0",
              borderRadius: isMobile ? 14 : 18, border: "none",
              background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
              color: "#fff", cursor: sending || !selectedShift ? "not-allowed" : "pointer",
              fontSize: isMobile ? 13 : 15, fontWeight: 700, letterSpacing: 0.3,
              opacity: sending || !selectedShift ? 0.55 : 1,
              boxShadow: "0 8px 28px color-mix(in srgb, var(--tc-primary) 36%, transparent), inset 0 1px 0 rgba(255,255,255,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "opacity 0.22s, box-shadow 0.28s cubic-bezier(0.4,0,0.2,1)",
            }}>
            {sending ? (
              <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} /> Sending…</>
            ) : (
              <><Zap size={isMobile ? 15 : 17} /> Send Broadcast</>
            )}
          </motion.button>
        </div>
      </div>

      {/* ─── MANUAL PAYROLL ASSIGNMENT CARD ───────────────────────────────────── */}
      <div
        className="admin-panel"
        style={{
          maxWidth: 780, position: "relative", zIndex: 1,
          borderRadius: isMobile ? 20 : 28, overflow: "hidden",
        }}
      >
        {/* Top gradient bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #10b981, var(--tc-primary), var(--tc-secondary), var(--tc-primary), #10b981)", backgroundSize: "200% 100%", animation: "gradientSlide 5s linear infinite" }} />

        {/* Inner prismatic glow */}
        <div style={{ position: "absolute", inset: 0, borderRadius: isMobile ? 20 : 28, pointerEvents: "none", background: dark ? "radial-gradient(ellipse at 20% 0%, rgba(16,185,129,0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(139,92,246,0.06) 0%, transparent 50%)" : "radial-gradient(ellipse at 20% 0%, rgba(16,185,129,0.04) 0%, transparent 55%)" }} />

        <div style={{ padding: isMobile ? "16px 14px 20px" : "28px 28px 32px", position: "relative" }}>
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 14 : 20 }}>
            <Wallet size={14} style={{ color: "#10b981" }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: textMuted }}>Manual Payroll Assignment</span>
          </div>

          {/* Date picker */}
          <div style={{ marginBottom: isMobile ? 16 : 24 }}>
            <label style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: textMuted, display: "block", marginBottom: isMobile ? 7 : 10 }}>
              Select Date
            </label>
            <input
              type="date"
              value={payrollDate}
              onChange={e => { setPayrollDate(e.target.value); fetchPayrollData(e.target.value); }}
              style={{
                ...inp,
                cursor: "pointer",
                colorScheme: dark ? "dark" : "light",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 18%, transparent)"; }}
              onBlur={e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Shift tabs */}
          {payrollShifts.length > 1 && (
            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <label style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: textMuted, display: "block", marginBottom: isMobile ? 7 : 10 }}>
                Select Shift
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {payrollShifts.map(s => {
                  const isActive = selectedPayrollShift === s.id;
                  return (
                    <button key={s.id} onClick={() => setSelectedPayrollShift(s.id)}
                      style={{
                        padding: "8px 16px", borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 600,
                        background: isActive ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                        color: isActive ? "#fff" : textMain,
                        border: `1px solid ${isActive ? "transparent" : border}`,
                        boxShadow: isActive ? "0 4px 14px color-mix(in srgb, var(--tc-primary) 30%, transparent)" : "none",
                        transition: "all 0.22s",
                      }}>
                      Shift {s.shift_number} · {s.start_time}–{s.end_time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content */}
          {payrollLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{ width: 28, height: 28, border: "3px solid var(--tc-primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, color: textMuted }}>Loading attendance data…</p>
            </div>
          ) : !payrollDate ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <CalendarIcon size={36} style={{ color: textMuted, margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: textMain, marginBottom: 4 }}>Select a date</p>
              <p style={{ fontSize: 12, color: textMuted }}>Choose an exam date to view assigned employees</p>
            </div>
          ) : payrollShifts.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: textMain, marginBottom: 4 }}>No shifts on this date</p>
              <p style={{ fontSize: 12, color: textMuted }}>No shifts found for the selected date</p>
            </div>
          ) : payrollShiftEmployees.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <Users size={36} style={{ color: textMuted, margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: textMain, marginBottom: 4 }}>No employees assigned</p>
              <p style={{ fontSize: 12, color: textMuted }}>Assign employees in the Attendance page first</p>
            </div>
          ) : (
            <>
              {/* Employee payroll table */}
              <div style={{ borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden", marginBottom: isMobile ? 14 : 20 }}>
                {/* Table header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 90px 80px" : "1fr 140px 120px 100px",
                  padding: "10px 14px",
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  borderBottom: `1px solid ${border}`,
                  gap: 8,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: textMuted }}>Employee</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: textMuted }}>Amount (₹)</span>
                  {!isMobile && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: textMuted }}>Reference</span>}
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: textMuted, textAlign: "center" }}>Action</span>
                </div>

                {/* Employee rows */}
                {payrollShiftEmployees.map((emp, i) => {
                  const assignment = emp.assignments[selectedPayrollShift];
                  const isSending = sendingPayments[emp.id];
                  return (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr 90px 80px" : "1fr 140px 120px 100px",
                        padding: "12px 14px",
                        borderBottom: i < payrollShiftEmployees.length - 1 ? `1px solid ${border}` : "none",
                        alignItems: "center",
                        gap: 8,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.015)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Employee info */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                          background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 12,
                        }}>
                          {(emp.full_name ?? "?")[0]?.toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: textMain, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.full_name}</p>
                          <p style={{ fontSize: 10, color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {assignment?.duty_role ?? "—"} {!isMobile && `· ${emp.email}`}
                          </p>
                        </div>
                      </div>

                      {/* Amount input */}
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={payrollAmounts[emp.id] ?? ""}
                        onChange={e => setPayrollAmounts(prev => ({ ...prev, [emp.id]: e.target.value }))}
                        style={{
                          width: "100%", padding: "7px 10px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                          background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${border}`, color: textMain, outline: "none",
                          fontFamily: "var(--font-outfit,'Outfit',sans-serif)",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                        onFocus={e => { e.target.style.borderColor = "#10b981"; e.target.style.boxShadow = "0 0 0 2px rgba(16,185,129,0.15)"; }}
                        onBlur={e => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; }}
                      />

                      {/* Reference input (desktop only) */}
                      {!isMobile && (
                        <input
                          type="text"
                          placeholder="Ref #"
                          value={payrollRefs[emp.id] ?? ""}
                          onChange={e => setPayrollRefs(prev => ({ ...prev, [emp.id]: e.target.value }))}
                          style={{
                            width: "100%", padding: "7px 10px", borderRadius: 10, fontSize: 12,
                            background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                            border: `1px solid ${border}`, color: textMain, outline: "none",
                            fontFamily: "var(--font-outfit,'Outfit',sans-serif)",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; }}
                          onBlur={e => { e.target.style.borderColor = border; }}
                        />
                      )}

                      {/* Action button */}
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <motion.button
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleSinglePayment(emp.id, emp.full_name)}
                          disabled={isSending || !payrollAmounts[emp.id]}
                          style={{
                            padding: "6px 14px", borderRadius: 10, border: "none", cursor: isSending || !payrollAmounts[emp.id] ? "not-allowed" : "pointer",
                            background: isSending ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff", fontSize: 11, fontWeight: 700,
                            opacity: isSending || !payrollAmounts[emp.id] ? 0.5 : 1,
                            display: "flex", alignItems: "center", gap: 5,
                            boxShadow: "0 3px 10px rgba(16,185,129,0.25)",
                            transition: "opacity 0.2s",
                          }}
                        >
                          {isSending ? (
                            <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .6s linear infinite" }} />
                          ) : (
                            <><Send size={11} /> Pay</>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Summary + Broadcast All */}
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ fontSize: 12, color: textMuted }}>
                  {payrollShiftEmployees.length} employee{payrollShiftEmployees.length !== 1 ? "s" : ""} ·
                  {" "}{Object.values(payrollAmounts).filter(v => parseFloat(v) > 0).length} with amounts entered
                </p>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 12px 32px color-mix(in srgb, var(--tc-primary) 40%, transparent)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBroadcastAll}
                  disabled={broadcastingAll || Object.values(payrollAmounts).filter(v => parseFloat(v) > 0).length === 0}
                  style={{
                    padding: isMobile ? "12px 0" : "12px 28px",
                    borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                    color: "#fff", cursor: broadcastingAll ? "not-allowed" : "pointer",
                    fontSize: 13, fontWeight: 700,
                    opacity: broadcastingAll || Object.values(payrollAmounts).filter(v => parseFloat(v) > 0).length === 0 ? 0.5 : 1,
                    boxShadow: "0 6px 20px color-mix(in srgb, var(--tc-primary) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "opacity 0.22s",
                  }}
                >
                  {broadcastingAll ? (
                    <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} /> Processing…</>
                  ) : (
                    <><Zap size={15} /> Broadcast All Payments</>
                  )}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


