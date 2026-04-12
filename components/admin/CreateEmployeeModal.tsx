"use client";
/**
 * CreateEmployeeModal — Redesigned to match shift creation modal exactly.
 * Same glass helpers, input styles, layout, animations.
 *
 * Step 0: AI Auto-Fill
 * Step 1: Essential fields (Name, Email, Phone, State, City, ID Proof)
 * Step 2: Optional fields (Alt Phone, Address, Bank, Notes)
 * Step 3: Preview + Confirm
 * Step 4: Success
 */

import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useCreateEmployee } from "@/hooks/use-api";
import { INDIAN_STATES } from "@/lib/validations/schemas";
import { toast } from "sonner";
import {
  X, User, Mail, Phone, MapPin, CreditCard, Building2,
  Sparkles, ArrowRight, ArrowLeft, Check, Copy, Eye, EyeOff,
  FileText, Loader2, Wand2, CheckCircle, Plus,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type FormData = {
  fullName: string; email: string; phone: string;
  state: string; city: string; idProofType: string;
  altPhone: string; addressLine1: string; addressLine2: string;
  pincode: string; bankAccount: string; bankIfsc: string;
  bankName: string; notes: string;
};

const INITIAL_FORM: FormData = {
  fullName: "", email: "", phone: "",
  state: "", city: "", idProofType: "",
  altPhone: "", addressLine1: "", addressLine2: "",
  pincode: "", bankAccount: "", bankIfsc: "",
  bankName: "", notes: "",
};

const ID_PROOF_OPTIONS = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
];

// ── iOS 26 Glassmorphism helpers (identical to shift modal) ─────────────────
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

export default function CreateEmployeeModal({ open, onClose }: Props) {
  const { dark } = useTheme();
  const g = dark ? glass.dark : glass.light;
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.52)" : "rgba(30,20,80,0.45)";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<{ employeeCode?: string; tempPassword?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const createMutation = useCreateEmployee();

  const set = useCallback((field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Input styles (identical to shift modal) ─────────────────────────────────
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

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 2,
    textTransform: "uppercase", display: "block", marginBottom: 7,
  };

  // AI auto-fill
  const handleAIFill = useCallback(async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/parse-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiText }),
      });
      let json: { status: string; message: string; data: any } = { status: "error", message: "Parsing failed", data: null };
      try { json = await res.json(); } catch (err) { }

      if (json.status === "ok" && json.data) {
        const d = json.data;
        setForm(prev => ({
          ...prev,
          ...(d.fullName && { fullName: d.fullName }),
          ...(d.email && { email: d.email }),
          ...(d.phone && { phone: d.phone }),
          ...(d.state && { state: d.state }),
          ...(d.city && { city: d.city }),
          ...(d.idProofType && { idProofType: d.idProofType }),
          ...(d.altPhone && { altPhone: d.altPhone }),
          ...(d.addressLine1 && { addressLine1: d.addressLine1 }),
          ...(d.addressLine2 && { addressLine2: d.addressLine2 }),
          ...(d.pincode && { pincode: d.pincode }),
          ...(d.bankAccount && { bankAccount: d.bankAccount }),
          ...(d.bankIfsc && { bankIfsc: d.bankIfsc }),
          ...(d.bankName && { bankName: d.bankName }),
          ...(d.notes && { notes: d.notes }),
        }));
        toast.success("AI auto-filled fields ✨");
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
  }, [aiText]);

  const essentialValid = form.fullName.length >= 2 && form.email.includes("@") &&
    /^[6-9]\d{9}$/.test(form.phone) && form.state && form.city && form.idProofType;

  const handleSubmit = useCallback(async () => {
    createMutation.mutate(form, {
      onSuccess: (data) => {
        const d = data as { employeeCode?: string; tempPassword?: string; message?: string };
        setResult({ employeeCode: d.employeeCode, tempPassword: d.tempPassword });
        toast.success(d.message || "Employee created!");
        setStep(4);
      },
      onError: (err) => {
        toast.error(err.message || "Creation failed");
      },
    });
  }, [createMutation, form]);

  const handleClose = useCallback(() => {
    setStep(0);
    setForm(INITIAL_FORM);
    setAiText("");
    setResult(null);
    setShowPassword(false);
    onClose();
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop (identical to shift modal) ─────────────────────── */}
          <motion.div
            key="employee-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            style={{ position: "fixed", inset: 0, zIndex: 9990, backdropFilter: "blur(8px) saturate(120%)", WebkitBackdropFilter: "blur(8px) saturate(120%)", background: "rgba(0,0,0,0.40)" }}
            onClick={step < 4 ? handleClose : undefined}
          />

          {/* ── Modal container (identical to shift modal) ──────────────── */}
          <motion.div
            key="employee-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(3px)" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
              pointerEvents: "none",
            }}>
            <div
              className="glass-panel-strong admin-panel"
              style={{
                pointerEvents: "all",
                width: "100%", maxWidth: 540,
                maxHeight: "88vh", overflowY: "auto",
                borderRadius: 28,
                background: "var(--spatial-glass-bg)",
                backdropFilter: "var(--spatial-glass-blur)",
                padding: "0 0 0",
                position: "relative",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}>
              {/* ── Gradient top bar (identical to shift modal) ──────── */}
              <div style={{ height: 3, borderRadius: "28px 28px 0 0", background: "linear-gradient(90deg, var(--tc-primary), var(--tc-secondary), var(--tc-accent), var(--tc-secondary), var(--tc-primary))", backgroundSize: "200% 100%", animation: "gradientSlide 4s linear infinite" }} />

              {/* ── Header (identical to shift modal) ────────────────── */}
              <div style={{ padding: "22px 26px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${g.innerBorder}` }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: textMain, marginBottom: 3 }}>New Employee</h3>
                  <p style={{ fontSize: 12, color: "var(--tc-primary)", fontWeight: 600, letterSpacing: 0.2 }}>
                    {["AI Auto-Fill", "Essential Info", "Optional Info", "Review", "Complete"][step]}
                  </p>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                  <X size={14} />
                </motion.button>
              </div>

              {/* ── Step indicator ────────────────────────────────────── */}
              <div style={{ padding: "12px 26px 0", display: "flex", gap: 6 }}>
                {["AI", "Essential", "Optional", "Review", "Done"].map((s, i) => (
                  <div key={s} style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: i <= step
                      ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))"
                      : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    transition: "all 0.3s ease",
                  }} />
                ))}
              </div>

              {/* ── Form content (shift modal style) ─────────────────── */}
              <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 16, flex: 1, overflowY: "auto" }}>
                <AnimatePresence mode="wait">

                  {/* ── Step 0: AI Auto-Fill ──────────────────────────── */}
                  {step === 0 && (
                    <motion.div key="ai" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
                      <div style={{ padding: 16, borderRadius: 16, background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${g.inputBorder}`, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tc-primary)", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
                            <Sparkles size={14} /> AI Auto-Fill
                          </span>
                        </div>
                        <div>
                          <label style={labelStyle}>Paste Employee Details</label>
                          <textarea
                            value={aiText}
                            onChange={e => setAiText(e.target.value)}
                            placeholder={`Paste the employee's details here, e.g.:\n\nName: Rajesh Kumar\nPhone: 9876543210\nEmail: rajesh@gmail.com\nState: Karnataka\nCity: Bangalore\nID Proof: Aadhaar`}
                            rows={7}
                            style={{ ...inp, resize: "none", padding: "10px 14px", minHeight: 120 }}
                            onFocus={inpFocus}
                            onBlur={inpBlur}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: "0 12px 36px color-mix(in srgb, var(--tc-primary) 45%, transparent)" }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleAIFill}
                          disabled={aiLoading || !aiText.trim()}
                          style={{
                            width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 14,
                            background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                            border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
                            cursor: aiLoading || !aiText.trim() ? "not-allowed" : "pointer",
                            opacity: aiLoading || !aiText.trim() ? 0.55 : 1,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            boxShadow: "0 6px 24px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                            transition: "opacity 0.2s, box-shadow 0.25s",
                          }}>
                          {aiLoading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Parsing with AI…</> : <><Wand2 size={15} /> AI Auto-Fill</>}
                        </motion.button>
                      </div>

                      <div style={{ textAlign: "center", color: textMuted, fontSize: 12, marginBottom: 12 }}>— or —</div>

                      <button
                        onClick={() => setStep(1)}
                        style={{
                          width: "100%", padding: "12px 0", borderRadius: 14,
                          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                          border: `1px dashed rgba(79,158,255,0.4)`, color: "var(--tc-primary)", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          transition: "all 0.2s",
                        }}>
                        <FileText size={14} /> Fill Manually <ArrowRight size={14} />
                      </button>
                    </motion.div>
                  )}

                  {/* ── Step 1: Essential Fields ──────────────────────── */}
                  {step === 1 && (
                    <motion.div key="essential" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
                      <div>
                        <label style={labelStyle}>Full Name *</label>
                        <input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Rajesh Kumar" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Email Address *</label>
                        <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="rajesh@example.com" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Phone (10-digit) *</label>
                        <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="9876543210" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                        <div>
                          <label style={labelStyle}>State *</label>
                          <select
                            value={form.state} onChange={e => set("state", e.target.value)}
                            style={{ ...inp, appearance: "none" as any, paddingRight: 30, color: form.state ? textMain : textMuted }}
                            onFocus={inpFocus} onBlur={inpBlur}>
                            <option value="">Select state</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s} style={{ background: dark ? "#0d0b22" : "#fff", color: textMain }}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>City *</label>
                          <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Bangalore" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>ID Proof Type *</label>
                        <select
                          value={form.idProofType} onChange={e => set("idProofType", e.target.value)}
                          style={{ ...inp, appearance: "none" as any, paddingRight: 30, color: form.idProofType ? textMain : textMuted }}
                          onFocus={inpFocus} onBlur={inpBlur}>
                          <option value="">Select ID proof</option>
                          {ID_PROOF_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: dark ? "#0d0b22" : "#fff", color: textMain }}>{o.label}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Optional Fields ──────────────────────── */}
                  {step === 2 && (
                    <motion.div key="optional" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
                      <p style={{ fontSize: 11, color: textMuted, marginBottom: 14 }}>These fields are optional — you can skip this step.</p>
                      <div>
                        <label style={labelStyle}>Alternate Phone</label>
                        <input value={form.altPhone} onChange={e => set("altPhone", e.target.value)} placeholder="9876543211" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Address Line 1</label>
                        <input value={form.addressLine1} onChange={e => set("addressLine1", e.target.value)} placeholder="123 MG Road" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                        <div>
                          <label style={labelStyle}>Address Line 2</label>
                          <input value={form.addressLine2} onChange={e => set("addressLine2", e.target.value)} placeholder="Apt/Floor" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                        </div>
                        <div>
                          <label style={labelStyle}>Pincode</label>
                          <input value={form.pincode} onChange={e => set("pincode", e.target.value)} placeholder="560001" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Bank Account No</label>
                        <input value={form.bankAccount} onChange={e => set("bankAccount", e.target.value)} placeholder="1234567890" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                        <div>
                          <label style={labelStyle}>IFSC Code</label>
                          <input value={form.bankIfsc} onChange={e => set("bankIfsc", e.target.value)} placeholder="SBIN0001234" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                        </div>
                        <div>
                          <label style={labelStyle}>Bank Name</label>
                          <input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="State Bank of India" style={inp} onFocus={inpFocus} onBlur={inpBlur} />
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Notes (optional)</label>
                        <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional instructions…" style={{ ...inp, resize: "none", padding: "8px 12px", minHeight: 36 }} onFocus={inpFocus} onBlur={inpBlur} />
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 3: Preview ───────────────────────────────── */}
                  {step === 3 && (
                    <motion.div key="preview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
                      <div style={{ padding: 16, borderRadius: 16, background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${g.inputBorder}`, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tc-primary)", textTransform: "uppercase", letterSpacing: 1 }}>Employee Preview</span>
                        </div>

                        {/* Avatar + Name */}
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 800 }}>
                            {form.fullName[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: textMain }}>{form.fullName || "—"}</p>
                            <p style={{ fontSize: 12, color: textMuted }}>{form.email || "—"}</p>
                          </div>
                        </div>

                        {/* Fields grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {[
                            { label: "Phone", value: form.phone },
                            { label: "State", value: form.state },
                            { label: "City", value: form.city },
                            { label: "ID Proof", value: ID_PROOF_OPTIONS.find(o => o.value === form.idProofType)?.label ?? "—" },
                            ...(form.altPhone ? [{ label: "Alt Phone", value: form.altPhone }] : []),
                            ...(form.pincode ? [{ label: "Pincode", value: form.pincode }] : []),
                            ...(form.bankName ? [{ label: "Bank", value: form.bankName }] : []),
                            ...(form.addressLine1 ? [{ label: "Address", value: form.addressLine1 }] : []),
                          ].map(f => (
                            <div key={f.label} style={{ padding: "8px 12px", borderRadius: 10, background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                              <p style={{ fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>{f.label}</p>
                              <p style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{f.value || "—"}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", fontSize: 12, color: "#fbbf24" }}>
                        ⚠️ A temporary password will be generated and emailed to <strong>{form.email}</strong>.
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 4: Success ────────────────────────────────── */}
                  {step === 4 && result && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                      <div style={{ textAlign: "center", paddingTop: 12 }}>
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                          style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#34d399" }}>
                          <Check size={28} />
                        </motion.div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: textMain, marginBottom: 6 }}>Employee Created!</h3>
                        <p style={{ fontSize: 13, color: textMuted, marginBottom: 24 }}>{form.fullName} has been added to the portal.</p>
                      </div>

                      <div style={{ padding: 16, borderRadius: 16, background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${g.inputBorder}`, marginBottom: 16 }}>
                        {[
                          { label: "Employee ID", value: result.employeeCode ?? "—", copyable: true },
                          { label: "Email", value: form.email, copyable: true },
                          { label: "Temp Password", value: result.tempPassword ?? "—", secret: true, copyable: true },
                        ].map((f, i, arr) => (
                          <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${g.inputBorder}` : "none" }}>
                            <div>
                              <p style={{ fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{f.label}</p>
                              <p style={{ fontSize: 14, fontWeight: 700, color: f.secret ? "var(--tc-primary)" : textMain, fontFamily: f.secret ? "monospace" : "inherit" }}>
                                {f.secret && !showPassword ? "••••••••••" : f.value}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              {f.secret && (
                                <button onClick={() => setShowPassword(v => !v)} style={{ width: 28, height: 28, borderRadius: 8, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: "none", cursor: "pointer", color: textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              )}
                              {f.copyable && (
                                <button onClick={() => { navigator.clipboard.writeText(f.value); toast.success(`${f.label} copied!`); }} style={{ width: 28, height: 28, borderRadius: 8, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: "none", cursor: "pointer", color: textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p style={{ fontSize: 11, color: "#10b981", textAlign: "center", marginBottom: 4 }}>
                        ✓ Credentials have been emailed to {form.email}
                      </p>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* ── Footer Navigation (identical to shift modal) ─────── */}
              <div style={{ padding: "14px 26px 18px", borderTop: `1px solid ${g.innerBorder}`, display: "flex", gap: 10, flexShrink: 0 }}>
                {step === 0 ? (
                  /* Step 0 has no footer buttons — actions are inline */
                  <div />
                ) : step === 4 ? (
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 12px 36px color-mix(in srgb, var(--tc-primary) 45%, transparent)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClose}
                    style={{
                      width: "100%", padding: "14px 0", borderRadius: 16,
                      background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                      border: "none", color: "#fff", cursor: "pointer",
                      fontSize: 15, fontWeight: 700, letterSpacing: 0.3,
                      boxShadow: "0 6px 24px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                      transition: "box-shadow 0.25s",
                    }}>
                    <CheckCircle size={16} /> Close
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setStep(s => s - 1)}
                      style={{
                        flex: 1, padding: "12px 0", borderRadius: 14,
                        background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        border: `1px solid ${g.inputBorder}`, color: textMain, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}>
                      <ArrowLeft size={14} /> Back
                    </motion.button>

                    {step < 3 ? (
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 12px 36px color-mix(in srgb, var(--tc-primary) 45%, transparent)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          if (step === 1 && !essentialValid) {
                            toast.error("Please fill all required fields correctly");
                            return;
                          }
                          setStep(s => s + 1);
                        }}
                        style={{
                          flex: 2, padding: "14px 0", borderRadius: 16,
                          background: (step === 1 && !essentialValid)
                            ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")
                            : "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                          border: "none",
                          color: (step === 1 && !essentialValid) ? textMuted : "#fff",
                          fontSize: 15, fontWeight: 700, letterSpacing: 0.3, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                          boxShadow: (step === 1 && !essentialValid) ? "none" : "0 6px 24px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                          transition: "all 0.25s",
                        }}>
                        {step === 2 ? "Review" : "Next"} <ArrowRight size={14} />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 12px 36px color-mix(in srgb, var(--tc-primary) 45%, transparent)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        disabled={createMutation.isPending}
                        style={{
                          flex: 2, padding: "14px 0", borderRadius: 16,
                          background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                          border: "none", color: "#fff",
                          fontSize: 15, fontWeight: 700, letterSpacing: 0.3,
                          cursor: createMutation.isPending ? "not-allowed" : "pointer",
                          opacity: createMutation.isPending ? 0.55 : 1,
                          boxShadow: "0 6px 24px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                          transition: "opacity 0.2s, box-shadow 0.25s",
                        }}>
                        {createMutation.isPending
                          ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />Creating…</>
                          : <><CheckCircle size={16} />Create Employee</>}
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
