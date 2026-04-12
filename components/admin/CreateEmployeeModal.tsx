"use client";
/**
 * CreateEmployeeModal — Glass Frost multi-step employee creation modal
 * 
 * Step 1: Essential fields (Name, Email, Phone, State, City, ID Proof)
 * Step 2: Optional fields (Alt Phone, Address, Bank, Notes)
 * Step 3: Preview + Confirm
 * 
 * Includes AI auto-fill text area for pasting structured messages.
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
  FileText, Loader2, Wand2,
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

export default function CreateEmployeeModal({ open, onClose }: Props) {
  const { dark } = useTheme();
  const [step, setStep] = useState(0); // 0=AI, 1=Essential, 2=Optional, 3=Preview
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<{ employeeCode?: string; tempPassword?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const createMutation = useCreateEmployee();

  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const inputBg   = dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.60)";
  const inputBdr  = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const border    = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";

  const set = useCallback((field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

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
      try {
        json = await res.json();
      } catch (err) { }

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
        setResult({
          employeeCode: d.employeeCode,
          tempPassword: d.tempPassword,
        });
        toast.success(d.message || "Employee created!");
        setStep(4); // Success step
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

  const steps = ["AI Fill", "Essential", "Optional", "Review", "Done"];

  // Glass input component
  const GlassInput = ({ label, icon: Icon, field, type = "text", placeholder, required = false }: {
    label: string; icon: React.ElementType; field: keyof FormData;
    type?: string; placeholder: string; required?: boolean;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
        <Icon size={11} /> {label} {required && <span style={{ color: "var(--tc-primary)" }}>*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 12,
          background: inputBg, border: `1px solid ${inputBdr}`,
          color: textMain, fontSize: 14, outline: "none",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', sans-serif",
          transition: "border-color 0.22s, box-shadow 0.22s",
          boxSizing: "border-box",
        }}
        onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 15%, transparent)"; }}
        onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );

  // Glass select component
  const GlassSelect = ({ label, icon: Icon, field, options, placeholder, required = false }: {
    label: string; icon: React.ElementType; field: keyof FormData;
    options: { value: string; label: string }[]; placeholder: string; required?: boolean;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
        <Icon size={11} /> {label} {required && <span style={{ color: "var(--tc-primary)" }}>*</span>}
      </label>
      <select
        value={form[field]}
        onChange={e => set(field, e.target.value)}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 12,
          background: inputBg, border: `1px solid ${inputBdr}`,
          color: form[field] ? textMain : textMuted, fontSize: 14, outline: "none",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', sans-serif",
          transition: "border-color 0.22s, box-shadow 0.22s",
          boxSizing: "border-box", appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
          paddingRight: 30,
        }}
        onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 15%, transparent)"; }}
        onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none"; }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: dark ? "#0d0b22" : "#fff", color: textMain }}>{o.label}</option>)}
      </select>
    </div>
  );

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="employee-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: "fixed", inset: 0, zIndex: 9990, backdropFilter: "blur(8px) saturate(120%)", WebkitBackdropFilter: "blur(8px) saturate(120%)", background: "rgba(0,0,0,0.40)" }}
            onClick={step < 4 ? handleClose : undefined}
          />
          
          {/* Modal Container */}
          <motion.div
            key="employee-modal-container"
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
              pointerEvents: "none"
            }}
          >
            {/* Modal */}
            <motion.div
              onClick={e => e.stopPropagation()}
              className="glass-panel-strong admin-panel"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
              style={{
                position: "relative",
                pointerEvents: "auto",
                width: "100%", maxWidth: 540, maxHeight: "88vh",
                borderRadius: 28,
                background: "rgba(20, 20, 25, 0.18)",
                backdropFilter: "var(--spatial-glass-blur)",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}
            >

        {/* Header */}
        <div style={{ padding: "24px 24px 18px", borderBottom: `1px solid ${border}`, flexShrink: 0, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: textMain, marginBottom: 2 }}>Create Employee</h2>
            <p style={{ fontSize: 11, color: textMuted }}>{steps[step]}</p>
          </div>
          <button onClick={handleClose} style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(239,68,68,0.10)", border: "none", cursor: "pointer", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: "8px 24px", display: "flex", gap: 6, flexShrink: 0, position: "relative", zIndex: 1 }}>
          {steps.map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: i <= step
                ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))"
                : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              transition: "all 0.18s ease",
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px 20px", position: "relative", zIndex: 1 }}>
          <AnimatePresence mode="wait">
            {/* Step 0: AI Auto-Fill */}
            {step === 0 && (
              <motion.div key="ai" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                <div className="admin-panel" style={{ position: "relative", borderRadius: 18, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <Sparkles size={17} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: textMain }}>AI Auto-Fill ✨</p>
                      <p style={{ fontSize: 11, color: textMuted }}>Paste the employee&apos;s message below</p>
                    </div>
                  </div>
                  <textarea
                    value={aiText}
                    onChange={e => setAiText(e.target.value)}
                    placeholder={`Paste the employee's details here, e.g.:\n\nName: Rajesh Kumar\nPhone: 9876543210\nEmail: rajesh@gmail.com\nState: Karnataka\nCity: Bangalore\nID Proof: Aadhaar`}
                    rows={8}
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 14,
                      background: inputBg, border: `1px solid ${inputBdr}`,
                      color: textMain, fontSize: 13, outline: "none", resize: "none",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', sans-serif",
                      lineHeight: 1.5, boxSizing: "border-box",
                      transition: "border-color 0.22s, box-shadow 0.22s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 15%, transparent)"; }}
                    onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none"; }}
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
                    border: `1px solid ${border}`, color: textMain, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  <FileText size={14} /> Fill Manually <ArrowRight size={14} />
                </motion.button>
              </motion.div>
            )}

            {/* Step 1: Essential Fields */}
            {step === 1 && (
              <motion.div key="essential" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                <GlassInput label="Full Name" icon={User} field="fullName" placeholder="Rajesh Kumar" required />
                <GlassInput label="Email Address" icon={Mail} field="email" type="email" placeholder="rajesh@example.com" required />
                <GlassInput label="Phone (10-digit)" icon={Phone} field="phone" placeholder="9876543210" required />
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <GlassSelect
                    label="State" icon={MapPin} field="state" required
                    options={INDIAN_STATES.map(s => ({ value: s, label: s }))}
                    placeholder="Select state"
                  />
                  <GlassInput label="City" icon={MapPin} field="city" placeholder="Bangalore" required />
                </div>

                <GlassSelect
                  label="ID Proof Type" icon={CreditCard} field="idProofType" required
                  options={ID_PROOF_OPTIONS}
                  placeholder="Select ID proof"
                />
              </motion.div>
            )}

            {/* Step 2: Optional Fields */}
            {step === 2 && (
              <motion.div key="optional" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                <p style={{ fontSize: 11, color: textMuted, marginBottom: 14 }}>These fields are optional — you can skip this step.</p>
                
                <GlassInput label="Alternate Phone" icon={Phone} field="altPhone" placeholder="9876543211" />
                <GlassInput label="Address Line 1" icon={MapPin} field="addressLine1" placeholder="123 MG Road" />
                <GlassInput label="Address Line 2" icon={MapPin} field="addressLine2" placeholder="Apt/Floor" />
                <GlassInput label="Pincode" icon={MapPin} field="pincode" placeholder="560001" />

                <div style={{ marginTop: 8, marginBottom: 8, height: 1, background: border }} />

                <GlassInput label="Bank Account No" icon={Building2} field="bankAccount" placeholder="1234567890" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <GlassInput label="IFSC Code" icon={Building2} field="bankIfsc" placeholder="SBIN0001234" />
                  <GlassInput label="Bank Name" icon={Building2} field="bankName" placeholder="State Bank of India" />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                    <FileText size={11} /> Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => set("notes", e.target.value)}
                    placeholder="Any admin remarks…"
                    rows={3}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: 12,
                      background: inputBg, border: `1px solid ${inputBdr}`,
                      color: textMain, fontSize: 13, outline: "none", resize: "none",
                      fontFamily: "inherit", boxSizing: "border-box",
                      transition: "border-color 0.22s, box-shadow 0.22s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 15%, transparent)"; }}
                    onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
              <motion.div key="preview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                <div className="admin-panel" style={{ position: "relative", borderRadius: 18, padding: 20, marginBottom: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: textMuted, textTransform: "uppercase", marginBottom: 14 }}>Employee Preview</p>

                  {/* Avatar + Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800 }}>
                      {form.fullName[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: textMain }}>{form.fullName || "—"}</p>
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
                      <div key={f.label} style={{ padding: "8px 12px", borderRadius: 10, background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>{f.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{f.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", fontSize: 12, color: "#fbbf24", marginBottom: 14 }}>
                  ⚠️ A temporary password will be generated and emailed to <strong>{form.email}</strong>.
                </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 4 && result && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                <div style={{ textAlign: "center", paddingTop: 12 }}>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#34d399" }}
                  >
                    <Check size={28} />
                  </motion.div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: textMain, marginBottom: 6 }}>Employee Created!</h3>
                  <p style={{ fontSize: 13, color: textMuted, marginBottom: 24 }}>{form.fullName} has been added to the portal.</p>
                </div>

                <div className="admin-panel" style={{ position: "relative", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  {[
                    { label: "Employee ID", value: result.employeeCode ?? "—", copyable: true },
                    { label: "Email", value: form.email, copyable: true },
                    { label: "Temp Password", value: result.tempPassword ?? "—", secret: true, copyable: true },
                  ].map(f => (
                    <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${border}` }}>
                      <div>
                        <p style={{ fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{f.label}</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: f.secret ? "var(--tc-primary)" : textMain, fontFamily: f.secret ? "monospace" : "inherit" }}>
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

                <p style={{ fontSize: 11, color: "#10b981", textAlign: "center", marginBottom: 16 }}>
                  ✓ Credentials have been emailed to {form.email}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleClose}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 14,
                    background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                    border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 6px 20px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                  }}
                >
                  Close
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {step >= 1 && step <= 3 && (
          <div style={{ padding: "14px 24px 18px", borderTop: `1px solid ${border}`, display: "flex", gap: 10, flexShrink: 0, position: "relative", zIndex: 1 }}>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 12,
                background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${border}`, color: textMain, fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <ArrowLeft size={14} /> Back
            </motion.button>

            {step < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (step === 1 && !essentialValid) {
                    toast.error("Please fill all required fields correctly");
                    return;
                  }
                  setStep(s => s + 1);
                }}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 12,
                  background: (step === 1 && !essentialValid)
                    ? (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)")
                    : "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                  border: "none",
                  color: (step === 1 && !essentialValid) ? textMuted : "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: (step === 1 && !essentialValid) ? "none" : "0 6px 16px color-mix(in srgb, var(--tc-primary) 30%, transparent)",
                  transition: "all 0.2s",
                }}
              >
                {step === 2 ? "Review" : "Next"} <ArrowRight size={14} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                  border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: createMutation.isPending ? "not-allowed" : "pointer",
                  opacity: createMutation.isPending ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 6px 16px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                }}
              >
                {createMutation.isPending ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating…</> : <><Check size={14} /> Create Employee</>}
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
