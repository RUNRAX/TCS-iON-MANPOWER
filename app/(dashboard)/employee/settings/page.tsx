"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  Settings, Mail, Phone, Bell, StickyNote, Shield,
  Layers, Check, Clock, CalendarDays,
} from "lucide-react";

/* ── Toggle switch ────────────────────────────────────────────────────────── */
function Toggle({ on, onToggle, color = "var(--tc-primary)" }: {
  on: boolean; onToggle: () => void; color?: string;
}) {
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 99, cursor: "pointer", border: "none",
        background: on ? color : "rgba(120,120,140,0.3)",
        position: "relative", transition: "background 0.3s",
      }}>
      <motion.div
        animate={{ x: on ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
      />
    </motion.button>
  );
}

/* ── Section header ───────────────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, dark }: {
  icon: React.ElementType; title: string; subtitle: string; dark: boolean;
}) {
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" }}>
        <Icon size={18} color="#fff" />
      </div>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: textMain }}>{title}</h2>
        <p style={{ fontSize: 11, color: textMuted }}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ── SettingRow — label + description + control ───────────────────────────── */
function SettingRow({ label, description, children, border }: {
  label: string; description?: string; children: React.ReactNode; border: string;
}) {
  const { dark } = useTheme();
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${border}`, gap: 16 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{label}</p>
        {description && <p style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export default function EmployeeSettings() {
  const { dark, glassFrost, setGlassFrost, glassBlur, setGlassBlur, glassOpacity, setGlassOpacity } = useTheme();

  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const border    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const inpBg     = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const inpBorder = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  // Local state for settings
  const [email,         setEmail]         = useState("");
  const [phone,         setPhone]         = useState("");
  const [shiftReminder, setShiftReminder] = useState(true);
  const [reminderTime,  setReminderTime]  = useState("1h");
  const [notes,         setNotes]         = useState("");
  const [twoStep,       setTwoStep]       = useState(false);

  // Load from profile API (read-only display)
  useEffect(() => {
    fetch("/api/employee/profile").then(r => r.json()).then(d => {
      const p = d.data?.profile;
      if (p) {
        setEmail(p.email ?? "");
        setPhone(p.phone ?? "");
      }
    }).catch(() => {});
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    background: inpBg, border: `1px solid ${inpBorder}`,
    color: textMain, fontSize: 13, outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 700, margin: "0 auto", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", boxShadow: "0 6px 20px color-mix(in srgb, var(--tc-primary) 30%, transparent)" }}>
            <Settings size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textMain, letterSpacing: -0.3 }}>Settings</h1>
            <p style={{ fontSize: 12, color: textMuted }}>Manage your account preferences</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Account Information ── */}
        <div className="admin-panel" style={{ position: "relative", borderRadius: 20, padding: 24 }}>
          <SectionHeader icon={Mail} title="Account Information" subtitle="Your contact details" dark={dark} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Email</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={14} style={{ color: "var(--tc-primary)", flexShrink: 0 }} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 15%, transparent)"; }}
                  onBlur={e => { e.target.style.borderColor = inpBorder; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Phone Number</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Phone size={14} style={{ color: "var(--tc-primary)", flexShrink: 0 }} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 99999 99999" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 15%, transparent)"; }}
                  onBlur={e => { e.target.style.borderColor = inpBorder; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
              className="admin-panel"
              style={{ position: "relative", padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 12, boxShadow: "0 4px 16px color-mix(in srgb, var(--tc-primary) 30%, transparent)" }}>
              <Check size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
              Save Changes
            </motion.button>
          </div>
        </div>

        {/* ── Shift Reminders ── */}
        <div className="admin-panel" style={{ position: "relative", borderRadius: 20, padding: 24 }}>
          <SectionHeader icon={Bell} title="Shift Reminders" subtitle="Get notified before your shifts" dark={dark} />

          <SettingRow label="Enable Shift Reminders" description="Receive notifications before your booked shifts" border={border}>
            <Toggle on={shiftReminder} onToggle={() => setShiftReminder(p => !p)} />
          </SettingRow>

          {shiftReminder && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              style={{ paddingTop: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Remind Me Before</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "30 min", value: "30m" },
                  { label: "1 hour", value: "1h" },
                  { label: "3 hours", value: "3h" },
                  { label: "1 day", value: "1d" },
                ].map(opt => (
                  <motion.button key={opt.value} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setReminderTime(opt.value)}
                    className="admin-panel"
                    style={{
                      position: "relative", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: reminderTime === opt.value ? "color-mix(in srgb, var(--tc-primary) 18%, transparent)" : "transparent",
                      border: reminderTime === opt.value ? "1px solid var(--tc-primary)" : `1px solid ${border}`,
                      color: reminderTime === opt.value ? "var(--tc-primary)" : textMuted,
                      transition: "all 0.2s",
                    }}>
                    <Clock size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Notes ── */}
        <div className="admin-panel" style={{ position: "relative", borderRadius: 20, padding: 24 }}>
          <SectionHeader icon={StickyNote} title="Personal Notes" subtitle="Keep track of important information" dark={dark} />

          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Write your notes here... e.g. shift preferences, reminders, etc."
            rows={5}
            style={{
              ...inputStyle,
              resize: "vertical", fontFamily: "inherit", lineHeight: 1.6,
            }}
            onFocus={e => { e.target.style.borderColor = "var(--tc-primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--tc-primary) 15%, transparent)"; }}
            onBlur={e => { e.target.style.borderColor = inpBorder; e.target.style.boxShadow = "none"; }}
          />
          <p style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>
            {notes.length > 0 ? `${notes.length} characters` : "Your notes are saved locally"}
          </p>
        </div>

        {/* ── Security — Two-Step Verification ── */}
        <div className="admin-panel" style={{ position: "relative", borderRadius: 20, padding: 24 }}>
          <SectionHeader icon={Shield} title="Security" subtitle="Protect your account" dark={dark} />

          <SettingRow label="Two-Step Verification" description="Add an extra layer of security with OTP verification on login" border={border}>
            <Toggle on={twoStep} onToggle={() => setTwoStep(p => !p)} />
          </SettingRow>

          {twoStep && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)", display: "flex", alignItems: "center", gap: 10 }}>
              <Check size={14} style={{ color: "#10b981" }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>2FA Enabled</p>
                <p style={{ fontSize: 11, color: textMuted }}>OTP will be sent to your registered phone number on login</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Glass Frost Mode ── */}
        <div className="admin-panel" style={{ position: "relative", borderRadius: 20, padding: 24 }}>
          <SectionHeader icon={Layers} title="Glass Frost Mode" subtitle="Control the visual design of your interface" dark={dark} />

          <SettingRow label="Glass Frost Effect" description="Enable the frosted glass transparency across all panels" border={border}>
            <Toggle on={glassFrost} onToggle={() => setGlassFrost(!glassFrost)} />
          </SettingRow>

          {/* Blur slider */}
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: textMain }}>Blur Intensity</p>
              <span style={{ fontSize: 11, color: textMuted }}>{glassBlur}px</span>
            </div>
            <input type="range" min={0} max={72} value={glassBlur} onChange={e => setGlassBlur(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--tc-primary)" }} />
          </div>

          {/* Opacity slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: textMain }}>Transparency</p>
              <span style={{ fontSize: 11, color: textMuted }}>{glassOpacity}%</span>
            </div>
            <input type="range" min={10} max={100} value={glassOpacity} onChange={e => setGlassOpacity(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--tc-primary)" }} />
          </div>
        </div>

      </div>
    </div>
  );
}
