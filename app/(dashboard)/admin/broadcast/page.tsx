"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAdminShifts } from "@/hooks/use-api";
import { Send, Clock, ChevronDown, Check, Zap, Users, Radio } from "lucide-react";
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
  const glassBg      = dark ? "rgba(10, 8, 26, 0.80)" : "rgba(255,255,255,0.35)";
  const glassBlur    = "blur(72px) saturate(210%) brightness(1.06)";
  const glassBorder  = dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.90)";
  const glassShadow  = dark
    ? "0 40px 100px rgba(0,0,0,0.60), 0 12px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.18)"
    : "0 20px 60px rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.98)";
  const inputBg      = dark ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.03)";
  const inputBorder  = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.09)";

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
    width: "100%", padding: "13px 16px", borderRadius: 16, fontSize: 14,
    background: inputBg, border: `1px solid ${inputBorder}`,
    color: textMain, outline: "none", resize: "none",
    fontFamily: "var(--font-outfit,'Outfit',sans-serif)",
    transition: "border-color 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s cubic-bezier(0.4,0,0.2,1), background 0.22s",
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "24px 28px", minHeight: "100%", position: "relative" }}>

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--tc-primary) 12%, transparent) 0%, transparent 70%)", filter: "blur(60px)", animation: "orbFloat1 20s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--tc-secondary) 10%, transparent) 0%, transparent 70%)", filter: "blur(60px)", animation: "orbFloat2 25s ease-in-out infinite" }} />
      </div>

      {/* Header */}
      <motion.div
        style={{ marginBottom: 32, position: "relative", zIndex: 1 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", boxShadow: "0 8px 24px color-mix(in srgb, var(--tc-primary) 35%, transparent)" }}>
            <Radio size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: textMain, letterSpacing: -0.5 }}>WhatsApp Broadcast</h1>
            <p style={{ fontSize: 13, color: textMuted, marginTop: 2 }}>Send shift notifications to employees instantly</p>
          </div>
        </div>
      </motion.div>

      {/* Main glass card */}
      <motion.div
        style={{
          maxWidth: 580, position: "relative", zIndex: 1,
          borderRadius: 28, background: glassBg,
          backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur,
          border: `1px solid ${glassBorder}`, boxShadow: glassShadow, overflow: "hidden",
        }}
      >
        {/* Top gradient bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--tc-primary), var(--tc-secondary), var(--tc-accent), var(--tc-secondary), var(--tc-primary))", backgroundSize: "200% 100%", animation: "gradientSlide 4s linear infinite" }} />

        {/* Inner prismatic glow */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 28, pointerEvents: "none", background: dark ? "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.09) 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(139,92,246,0.07) 0%, transparent 50%)" : "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.05) 0%, transparent 55%)" }} />

        <div style={{ padding: "28px 28px 32px", position: "relative" }}>

          {/* Shift selector */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.28 }} style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: textMuted, display: "block", marginBottom: 10 }}>
              Select Shift
            </label>
            {isLoading ? (
              <div style={{ height: 50, borderRadius: 16, overflow: "hidden" }}><div className="skeleton" style={{ width: "100%", height: "100%" }} /></div>
            ) : (
              <GlassSelect value={selectedShift} onChange={setSelectedShift} options={shiftOptions} placeholder="Choose a published shift…" dark={dark} textMain={textMain} textMuted={textMuted} />
            )}
          </motion.div>

          {/* Target group */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20, duration: 0.28 }} style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: textMuted, display: "block", marginBottom: 10 }}>
              Target Group
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {targetGroups.map(g => {
                const Icon = g.icon;
                const isActive = targetGroup === g.id;
                return (
                  <motion.button key={g.id} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    onClick={() => setTargetGroup(g.id)}
                    className="admin-panel"
                    style={{
                      flex: 1, padding: "16px 12px", borderRadius: 16, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      background: isActive ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" : dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isActive ? "transparent" : (dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)")}`,
                      boxShadow: isActive ? "0 6px 20px color-mix(in srgb, var(--tc-primary) 32%, transparent), inset 0 1px 0 rgba(255,255,255,0.20)" : dark ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.80)",
                      transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)",
                    }}>
                    <Icon size={15} color={isActive ? "#fff" : "var(--tc-primary)"} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? "#fff" : textMain }}>{g.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Custom message */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.28 }} style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: textMuted, display: "block", marginBottom: 10 }}>
              Custom Message <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, opacity: 0.7 }}>(optional)</span>
            </label>
            <textarea rows={4} value={customMsg} onChange={e => setCustomMsg(e.target.value)}
              className="admin-panel"
              placeholder="Leave blank to use the default shift notification template…"
              style={inp}
              onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 18%, transparent)"; e.target.style.background = dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.96)"; }}
              onBlur={e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; e.target.style.background = inputBg; }}
            />
            <p style={{ fontSize: 11, color: textMuted, marginTop: 7, paddingLeft: 2 }}>
              {customMsg.length > 0 ? `${customMsg.length} characters` : "Default WhatsApp template will be used"}
            </p>
          </motion.div>

          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 14px 40px color-mix(in srgb, var(--tc-primary) 48%, transparent)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            onClick={handleSend} disabled={sending || !selectedShift}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 18, border: "none",
              background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
              color: "#fff", cursor: sending || !selectedShift ? "not-allowed" : "pointer",
              fontSize: 15, fontWeight: 700, letterSpacing: 0.3,
              opacity: sending || !selectedShift ? 0.55 : 1,
              boxShadow: "0 8px 28px color-mix(in srgb, var(--tc-primary) 36%, transparent), inset 0 1px 0 rgba(255,255,255,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "opacity 0.22s, box-shadow 0.28s cubic-bezier(0.4,0,0.2,1)",
            }}>
            {sending ? (
              <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} /> Sending…</>
            ) : (
              <><Zap size={17} /> Send Broadcast</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
