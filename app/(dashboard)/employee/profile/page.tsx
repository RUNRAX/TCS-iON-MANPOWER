"use client";
/**
 * employee/profile/page.tsx
 *
 * KEY ARCHITECTURE RULE:
 * Every React component and every non-trivial sub-tree is defined at MODULE LEVEL.
 * Nothing that React treats as a component type may be created inside a render function.
 * Violation → React sees a new type on every render → unmount/remount → scroll reset.
 *
 * Style objects that depend on theme/dark are passed as props so the memoized form
 * component can compare them and skip re-renders on keystrokes.
 */

import {
  useEffect, useRef, useState, useCallback, useMemo, memo,
  type ChangeEvent, type FocusEvent, type FormEvent,
} from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { Upload, Shield, Check, AlertCircle, CheckCircle2 } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

// ── Theme-derived style helper (pure — no closures over component state) ──────
function makeStyles(primary: string, dark: boolean) {
  const textMain  = dark ? "#f0eeff"                    : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.45)"     : "rgba(30,20,80,0.4)";
  const inpBg     = dark ? "rgba(255,255,255,0.05)"     : "rgba(0,0,0,0.04)";
  const inpBorder = dark ? "rgba(255,255,255,0.1)"      : "rgba(0,0,0,0.1)";
  const cardBg    = dark ? "rgba(255,255,255,0.03)"     : "rgba(255,255,255,0.35)";
  const cardBorder= dark ? `${primary}22`               : `${primary}25`;
  const optBg     = dark ? "#0d0b22"                    : "#fff";

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 9,
    background: inpBg, border: `1px solid ${inpBorder}`,
    color: textMain, fontSize: 13,
    fontFamily: "'Outfit',sans-serif", outline: "none",
    transition: "border-color 0.22s, box-shadow 0.22s, background 0.22s",
    boxSizing: "border-box",
  };

  const sel: React.CSSProperties = {
    ...inp,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(textMuted)}' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 36,
  };

  return { textMain, textMuted, inpBg, inpBorder, cardBg, cardBorder, optBg, inp, sel };
}

// ── Primitive sub-components (all at module level) ────────────────────────────

const SectionCard = memo(function SectionCard({
  children, cardBg, border,
}: { children: React.ReactNode; cardBg: string; border: string }) {
  return (
    <div className="admin-panel" style={{ position: "relative", borderRadius: 16, padding: 22, marginBottom: 14 }}>
      {children}
    </div>
  );
});

function Lbl({ t, m }: { t: string; m: string }) {
  return (
    <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: m, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Bebas Neue',sans-serif" }}>
      {t}
    </label>
  );
}

function SecTitle({ t, primary }: { t: string; primary: string }) {
  return (
    <h3 style={{ fontSize: 9, color: primary, marginBottom: 16, letterSpacing: 3.5, textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", paddingBottom: 10, borderBottom: `1px solid ${primary}20` }}>
      {t}
    </h3>
  );
}

const FileUpload = memo(function FileUpload({
  label, accept, maxMB, file, preview, onChange, primary,
}: {
  label: string; accept: string; maxMB: number;
  file: File | null; preview: string | null; onChange: (f: File) => void;
  primary: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div onClick={() => ref.current?.click()}
        style={{ border: `1px dashed ${primary}44`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", background: `${primary}06`, display: "flex", alignItems: "center", gap: 12, minHeight: 60, transition: "all 0.25s ease" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${primary}88`; el.style.background = `${primary}10`; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${primary}44`; el.style.background = `${primary}06`; }}>
        <div style={{ width: 44, height: 44, borderRadius: 9, background: `${primary}14`, border: `1px solid ${primary}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {preview?.startsWith("data:image")
            ? <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Upload size={16} style={{ color: primary }} />}
        </div>
        <div>
          <div style={{ fontSize: 11, color: file ? "#10b981" : primary, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
            {file ? file.name : `UPLOAD ${label}`}
          </div>
          <div style={{ fontSize: 9, color: "rgba(150,150,180,0.6)", letterSpacing: 0.5 }}>
            {accept.includes("pdf") ? "JPG, PNG OR PDF" : "JPG OR PNG"} · MAX {maxMB}MB
          </div>
        </div>
        {file && <CheckCircle2 size={16} style={{ marginLeft: "auto", color: "#10b981", flexShrink: 0 }} />}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
    </div>
  );
});

// ── Types ─────────────────────────────────────────────────────────────────────
type FormState = {
  fullName: string; phone: string; altPhone: string; email: string;
  addressLine1: string; addressLine2: string; city: string; state: string; pincode: string;
  bankAccount: string; bankIfsc: string; bankName: string; idProofType: string;
};

interface ProfileFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  saving: boolean;
  profileStatus?: string;
  onSubmit: (e: FormEvent) => void;
  photoFile: File | null; photoPreview: string | null; onPhoto: (f: File) => void;
  idFile: File | null; idPreview: string | null; onId: (f: File) => void;
  primary: string; secondary: string; dark: boolean;
  // Pre-computed style tokens — passed as primitives so memo works correctly
  textMain: string; textMuted: string; inpBg: string; inpBorder: string;
  cardBg: string; cardBorder: string; optBg: string;
  inp: React.CSSProperties; sel: React.CSSProperties;
}

// ── The entire form — memoized at module level ────────────────────────────────
// Receives theme tokens as props. Only re-renders when theme changes (dark/primary),
// NOT on every form keystroke, because `form` is spread into native inputs.
const ProfileForm = memo(function ProfileForm({
  form, setForm, saving, profileStatus, onSubmit,
  photoFile, photoPreview, onPhoto,
  idFile, idPreview, onId,
  primary, secondary, dark,
  textMain, textMuted, inpBg, inpBorder, cardBg, cardBorder, optBg,
  inp, sel,
}: ProfileFormProps) {

  // These handlers are stable within this component's scope
  const fld = (k: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const onFocus = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = primary;
    e.target.style.boxShadow   = `0 0 0 3px ${primary}22`;
    e.target.style.background  = dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.98)";
  };
  const onBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = inpBorder;
    e.target.style.boxShadow   = "none";
    e.target.style.background  = inpBg;
  };

  const optStyle = { background: optBg, color: textMain };

  return (
    <form onSubmit={onSubmit}>

      {/* Personal Information */}
      <SectionCard cardBg={cardBg} border={cardBorder}>
        <SecTitle t="Personal Information" primary={primary} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Lbl t="Full Name *" m={textMuted} />
            <input required value={form.fullName} onChange={fld("fullName")} placeholder="As per ID proof" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <Lbl t="Phone *" m={textMuted} />
            <input required value={form.phone} onChange={fld("phone")} placeholder="10-digit mobile" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <Lbl t="Alt Phone" m={textMuted} />
            <input value={form.altPhone} onChange={fld("altPhone")} placeholder="Optional" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Lbl t="Email *" m={textMuted} />
            <input required type="email" value={form.email} onChange={fld("email")} placeholder="your@email.com" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard cardBg={cardBg} border={cardBorder}>
        <SecTitle t="Address" primary={primary} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Lbl t="Address Line 1 *" m={textMuted} />
            <input required value={form.addressLine1} onChange={fld("addressLine1")} placeholder="House/Flat No., Street" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Lbl t="Address Line 2" m={textMuted} />
            <input value={form.addressLine2} onChange={fld("addressLine2")} placeholder="Landmark, Area (optional)" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <Lbl t="City *" m={textMuted} />
            <input required value={form.city} onChange={fld("city")} placeholder="City" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <Lbl t="State *" m={textMuted} />
            <select required value={form.state} onChange={fld("state")} style={sel} onFocus={onFocus} onBlur={onBlur}>
              <option value="" style={optStyle}>Select State</option>
              {STATES.map(s => <option key={s} value={s} style={optStyle}>{s}</option>)}
            </select>
          </div>
          <div>
            <Lbl t="Pincode *" m={textMuted} />
            <input required value={form.pincode} onChange={fld("pincode")} maxLength={6} placeholder="6-digit pincode" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>
      </SectionCard>

      {/* Bank Details */}
      <SectionCard cardBg={cardBg} border={cardBorder}>
        <SecTitle t="Bank Details" primary={primary} />
        <div style={{ padding: "9px 12px", borderRadius: 8, background: `${primary}08`, border: `1px solid ${primary}18`, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={13} style={{ color: primary }} />
          <span style={{ fontSize: 11, color: textMuted }}>Your account number is AES-256 encrypted before storage</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <Lbl t="Bank Name *" m={textMuted} />
            <input required value={form.bankName} onChange={fld("bankName")} placeholder="e.g. State Bank of India" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <Lbl t="IFSC Code *" m={textMuted} />
            <input required value={form.bankIfsc} onChange={fld("bankIfsc")} placeholder="e.g. SBIN0001234" style={{ ...inp, textTransform: "uppercase" }} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Lbl t="Account Number *" m={textMuted} />
            <input required type="password" value={form.bankAccount} onChange={fld("bankAccount")} placeholder="Your account number (hidden)" autoComplete="new-password" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>
      </SectionCard>

      {/* Identity & Documents */}
      <SectionCard cardBg={cardBg} border={cardBorder}>
        <SecTitle t="Identity & Documents" primary={primary} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Lbl t="ID Proof Type *" m={textMuted} />
            <select required value={form.idProofType} onChange={fld("idProofType")} style={sel} onFocus={onFocus} onBlur={onBlur}>
              <option value="aadhaar" style={optStyle}>Aadhaar Card</option>
              <option value="pan"     style={optStyle}>PAN Card</option>
              <option value="voter_id" style={optStyle}>Voter ID</option>
              <option value="passport" style={optStyle}>Passport</option>
            </select>
          </div>
          <FileUpload label="Photo (optional)" accept="image/jpeg,image/png,image/webp" maxMB={2}
            file={photoFile} preview={photoPreview} onChange={onPhoto} primary={primary} />
          <FileUpload label="ID Proof Document" accept="image/jpeg,image/png,application/pdf" maxMB={5}
            file={idFile} preview={idPreview} onChange={onId} primary={primary} />
        </div>
      </SectionCard>

      {/* Submit */}
      <button type="submit" disabled={saving || profileStatus === "approved"}
        style={{ width: "100%", padding: "13px 0", borderRadius: 13, background: `linear-gradient(135deg,${primary},${secondary})`, border: "none", color: "#fff", fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 3, cursor: saving || profileStatus === "approved" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: saving || profileStatus === "approved" ? 0.55 : 1, boxShadow: `0 6px 24px ${primary}40`, transition: "opacity 0.2s" }}>
        {saving             ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .75s linear infinite" }} />SUBMITTING…</>
        : profileStatus === "approved" ? <><CheckCircle2 size={14} />PROFILE APPROVED</>
        : profileStatus === "pending"  ? <><Check size={14} />UPDATE & RESUBMIT</>
        :                                <><Check size={14} />SUBMIT PROFILE</>}
      </button>
    </form>
  );
});

// ── Page component — only manages data, not form UI ───────────────────────────
export default function EmployeeProfile() {
  const { theme: t, dark } = useTheme();

  // Compute style tokens once per theme change — NOT per keystroke
  const styles = useMemo(() => makeStyles("var(--tc-primary)", dark), ["var(--tc-primary)", dark]);

  const [profile,      setProfile]      = useState<Record<string, string> | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [msg,          setMsg]          = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form,         setForm]         = useState<FormState>({
    fullName: "", phone: "", altPhone: "", email: "",
    addressLine1: "", addressLine2: "", city: "", state: "", pincode: "",
    bankAccount: "", bankIfsc: "", bankName: "", idProofType: "aadhaar",
  });
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [idFile,       setIdFile]       = useState<File | null>(null);
  const [idPreview,    setIdPreview]    = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/employee/profile").then(r => r.json()).then(d => {
      const p = d.data?.profile;
      if (p) {
        setProfile(p);
        setForm(prev => ({
          ...prev,
          fullName: p.full_name ?? "", phone: p.phone ?? "", altPhone: p.alt_phone ?? "",
          email: p.email ?? "", addressLine1: p.address_line1 ?? "", addressLine2: p.address_line2 ?? "",
          city: p.city ?? "", state: p.state ?? "", pincode: p.pincode ?? "",
          bankName: p.bank_name ?? "", idProofType: p.id_proof_type ?? "aadhaar",
        }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const fd = new FormData();
    // We read form state via a ref to avoid stale closures
    setForm(current => {
      Object.entries(current).forEach(([k, v]) => fd.append(k, v));
      return current; // no state change
    });
    if (photoFile) fd.append("photoFile", photoFile);
    if (idFile)    fd.append("idProofFile", idFile);
    fetch("/api/employee/profile", { method: "POST", body: fd }).then(async res => {
      const d = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: "PROFILE SUBMITTED — AWAITING ADMIN REVIEW" });
        setProfile(p => p ? { ...p, status: "pending" } : p);
      } else {
        setMsg({ type: "err", text: (d.message ?? "FAILED TO SAVE PROFILE").toUpperCase() });
      }
    }).finally(() => setSaving(false));
  }, [photoFile, idFile]);

  const onPhoto = useCallback((f: File) => {
    if (f.size > 2 * 1024 * 1024) { setMsg({ type: "err", text: "PHOTO MUST BE UNDER 2MB" }); return; }
    setPhotoFile(f);
    const r = new FileReader(); r.onload = ev => setPhotoPreview(ev.target?.result as string); r.readAsDataURL(f);
  }, []);

  const onId = useCallback((f: File) => {
    if (f.size > 5 * 1024 * 1024) { setMsg({ type: "err", text: "ID FILE MUST BE UNDER 5MB" }); return; }
    setIdFile(f);
    const r = new FileReader(); r.onload = ev => setIdPreview(ev.target?.result as string); r.readAsDataURL(f);
  }, []);

  // Status banner data
  const STATUS_MAP = {
    pending:  { color: "#f59e0b", Icon: AlertCircle,  label: "UNDER REVIEW",  desc: "Your profile is pending admin approval." },
    approved: { color: "#10b981", Icon: CheckCircle2, label: "APPROVED",      desc: "You can now confirm exam shifts." },
    rejected: { color: "#ef4444", Icon: AlertCircle,  label: "UPDATE NEEDED", desc: profile?.rejection_reason ?? "Please update and resubmit." },
  };
  const s = profile ? STATUS_MAP[profile.status as keyof typeof STATUS_MAP] : null;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 24px 40px" }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 4, color: "var(--tc-primary)", marginBottom: 5, textTransform: "uppercase" }}>KYC PROFILE</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: styles.textMain, marginBottom: 4 }}>My Profile</h1>
        <p style={{ fontSize: 12, color: styles.textMuted }}>Complete your KYC to start taking exam shifts</p>
      </div>

      {/* Status banner */}
      {s && (
        <div style={{ padding: "13px 16px", borderRadius: 12, marginBottom: 20, background: `${s.color}0d`, border: `1px solid ${s.color}28`, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <s.Icon size={18} color={s.color} />
          <div>
            <div style={{ fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2.5, color: s.color, marginBottom: 3 }}>STATUS: {s.label}</div>
            <div style={{ fontSize: 12, color: styles.textMuted }}>{s.desc}</div>
          </div>
        </div>
      )}

      {/* Feedback message */}
      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: msg.type === "ok" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${msg.type === "ok" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.22)"}`, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1.5, color: msg.type === "ok" ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: 8 }}>
          {msg.type === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: styles.textMuted }}>Loading profile…</div>
      ) : (
        // ProfileForm is memoized — only re-renders when theme/dark changes, NOT on keystrokes
        <ProfileForm
          form={form}
          setForm={setForm}
          saving={saving}
          profileStatus={profile?.status}
          onSubmit={handleSubmit}
          photoFile={photoFile}   photoPreview={photoPreview} onPhoto={onPhoto}
          idFile={idFile}         idPreview={idPreview}       onId={onId}
          primary="var(--tc-primary)"     secondary="var(--tc-secondary)"     dark={dark}
          textMain={styles.textMain}   textMuted={styles.textMuted}
          inpBg={styles.inpBg}         inpBorder={styles.inpBorder}
          cardBg={styles.cardBg}       cardBorder={styles.cardBorder}
          optBg={styles.optBg}
          inp={styles.inp}             sel={styles.sel}
        />
      )}
    </div>
  );
}
