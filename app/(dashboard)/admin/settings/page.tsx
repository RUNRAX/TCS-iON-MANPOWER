"use client";
/**
 * app/(dashboard)/admin/settings/page.tsx — Admin Settings
 *
 * Full settings page with:
 *   • Glass Frost Mode toggle
 *   • Profile Details
 *   • Two-Step Verification
 *   • Shift Reminders
 *   • Active Period
 *   • Notes section with Calendar
 *   • Custom Background import
 */

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  User, Shield, Bell, Clock, StickyNote, Calendar,
  ImageIcon, ChevronRight, Check, Upload, Trash2,
  Smartphone, Eye, EyeOff, Lock, Mail,
  Sun, Moon, Paintbrush, X, ChevronLeft,
} from "lucide-react";

const FONT_DISPLAY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif";
const FONT_SYSTEM  = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', sans-serif";
const BLUR = "blur(36px) saturate(200%) brightness(1.06)";

/* ── Toggle Switch component ─────────────────────────────────────────────── */
function Toggle({ checked, onChange, accent }: { checked: boolean; onChange: (v: boolean) => void; accent?: string }) {
  return (
    <motion.button
      onClick={() => onChange(!checked)}
      animate={{ background: checked ? (accent ?? "var(--tc-primary)") : "rgba(255,255,255,0.08)" }}
      style={{
        width: 44, height: 24, borderRadius: 12, position: "relative", cursor: "pointer",
        border: `1px solid ${checked ? "transparent" : "rgba(255,255,255,0.12)"}`,
        transition: "all 0.2s ease",
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </motion.button>
  );
}

/* ── Glass Card wrapper ──────────────────────────────────────────────────── */
function SettingsCard({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden admin-panel"
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ── Section Header ──────────────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, dark }: {
  icon: React.ElementType; title: string; subtitle?: string; dark: boolean;
}) {
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.50)" : "rgba(30,20,80,0.44)";
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: "color-mix(in srgb, var(--tc-primary) 12%, transparent)",
          color: "var(--tc-primary)",
        }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-sm font-bold" style={{ color: textMain, fontFamily: FONT_DISPLAY }}>{title}</h3>
        {subtitle && <p className="text-[11px]" style={{ color: textMuted }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ── Settings Row ────────────────────────────────────────────────────────── */
function SettingsRow({ label, description, dark, children }: {
  label: string; description?: string; dark: boolean; children: React.ReactNode;
}) {
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.50)" : "rgba(30,20,80,0.44)";
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}` }}>
      <div>
        <p className="text-[13px] font-medium" style={{ color: textMain, fontFamily: FONT_SYSTEM }}>{label}</p>
        {description && <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main Settings Component
══════════════════════════════════════════════════════════════════════════════ */
export default function AdminSettings() {
  const { 
    dark, 
    glassFrost, setGlassFrost, 
    glassBlur, setGlassBlur, 
    glassOpacity, setGlassOpacity,
    bgIndex, setBgIndex,
    autoBg, setAutoBg 
  } = useTheme();

  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.50)" : "rgba(30,20,80,0.44)";

  // ── State ──
  const [shiftReminders, setShiftReminders] = useState(true);
  const [twoStep, setTwoStep] = useState(false);
  const [showTwoStepSetup, setShowTwoStepSetup] = useState(false);
  const [activeStart, setActiveStart] = useState("09:00");
  const [activeEnd, setActiveEnd] = useState("18:00");
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);

  // Notes
  const [notes, setNotes] = useState<Array<{ id: string; date: string; text: string }>>([]);
  const [selectedDate, setSelectedDate] = useState("");

  React.useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setNotes([{ id: "1", date: today, text: "" }]);
    setSelectedDate(today);
  }, []);

  const currentNote = notes.find(n => n.date === selectedDate);

  const updateNote = (text: string) => {
    setNotes(prev => {
      const exists = prev.find(n => n.date === selectedDate);
      if (exists) {
        return prev.map(n => n.date === selectedDate ? { ...n, text } : n);
      }
      return [...prev, { id: Date.now().toString(), date: selectedDate, text }];
    });
  };

  const handleBgUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setCustomBgUrl(url);
        // Store in localStorage for persistence
        const reader = new FileReader();
        reader.onload = () => {
          localStorage.setItem("tc_custom_bg", reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, []);

  const clearCustomBg = useCallback(() => {
    setCustomBgUrl(null);
    localStorage.removeItem("tc_custom_bg");
  }, []);

  // Load custom background on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("tc_custom_bg");
    if (saved) setCustomBgUrl(saved);
  }, []);

  /* Animation variants */
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div
        className="max-w-4xl mx-auto space-y-5"
      >
        {/* Page Header */}
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: textMain, fontFamily: FONT_DISPLAY, fontWeight: 800 }}
          >
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: textMuted, fontFamily: FONT_SYSTEM }}>
            Customize your portal experience
          </p>
        </div>

        {/* ── Glass Frost Mode ── */}
        <div>
          <SettingsCard dark={dark}>
            <SectionHeader icon={Paintbrush} title="Glass Frost Mode" subtitle="Control the visual design of your interface" dark={dark} />
            <SettingsRow label="Glass Frost Effect" description="Enable the frosted glass transparency effect across all panels" dark={dark}>
              <Toggle checked={glassFrost} onChange={setGlassFrost} />
            </SettingsRow>
            <SettingsRow label="Blur Intensity" description="Adjust the backdrop blur strength" dark={dark}>
              <input
                type="range"
                min={0} max={100} value={glassBlur} onChange={e => setGlassBlur(Number(e.target.value))}
                className="w-24 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--tc-primary), var(--tc-secondary))`,
                  accentColor: "var(--tc-primary)",
                }}
              />
            </SettingsRow>
            <SettingsRow label="Transparency Level" description="Set the panel opacity level" dark={dark}>
              <input
                type="range"
                min={0} max={100} value={glassOpacity} onChange={e => setGlassOpacity(Number(e.target.value))}
                className="w-24 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--tc-primary), var(--tc-secondary))`,
                  accentColor: "var(--tc-primary)",
                }}
              />
            </SettingsRow>
          </SettingsCard>
        </div>

        {/* ── Profile Details ── */}
        <div>
          <SettingsCard dark={dark}>
            <SectionHeader icon={User} title="Profile Details" subtitle="Manage your personal information" dark={dark} />
            <div className="space-y-3">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 0 20px color-mix(in srgb, var(--tc-primary) 30%, transparent)",
                  }}
                >
                  AU
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: textMain }}>Admin User</p>
                  <p className="text-[11px]" style={{ color: textMuted }}>Administrator · TCS iON</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-1 text-[11px] font-semibold px-3 py-1 rounded-lg"
                    style={{
                      background: "color-mix(in srgb, var(--tc-primary) 10%, transparent)",
                      color: "var(--tc-primary)",
                      border: "1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)",
                      cursor: "pointer",
                    }}
                  >
                    Change Avatar
                  </motion.button>
                </div>
              </div>
              {[
                { label: "Full Name", value: "Admin User", icon: User },
                { label: "Email", value: "admin@tcsion.com", icon: Mail },
                { label: "Phone", value: "+91 98765 43210", icon: Smartphone },
              ].map(field => (
                <div key={field.label} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}` }}>
                  <field.icon className="w-4 h-4 flex-shrink-0" style={{ color: textMuted }} />
                  <div className="flex-1">
                    <p className="text-[11px]" style={{ color: textMuted }}>{field.label}</p>
                    <p className="text-[13px] font-medium" style={{ color: textMain }}>{field.value}</p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
                </div>
              ))}
            </div>
          </SettingsCard>
        </div>

        {/* ── Two-Step Verification ── */}
        <div>
          <SettingsCard dark={dark}>
            <SectionHeader icon={Shield} title="Two-Step Verification" subtitle="Add an extra layer of security to your account" dark={dark} />
            <SettingsRow label="Enable 2FA" description="Require a verification code on login" dark={dark}>
              <Toggle checked={twoStep} onChange={(v) => { setTwoStep(v); if (v) setShowTwoStepSetup(true); }} accent="#10b981" />
            </SettingsRow>

            {showTwoStepSetup && (
              <div
                className="mt-3 p-4 rounded-xl"
                style={{
                  background: dark ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.04)",
                  border: `1px solid ${dark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.12)"}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: textMain }}>Setup Required</p>
                    <p className="text-[11px] mt-1" style={{ color: textMuted }}>
                      Two-step verification will be set up with your authenticator app.
                      This feature will be activated in a future update.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="text-[11px] font-semibold px-4 py-1.5 rounded-lg"
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          cursor: "pointer",
                          border: "none",
                        }}
                      >
                        Begin Setup
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setShowTwoStepSetup(false); setTwoStep(false); }}
                        className="text-[11px] font-semibold px-4 py-1.5 rounded-lg"
                        style={{
                          background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                          color: textMuted,
                          cursor: "pointer",
                          border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                        }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: twoStep ? "#10b981" : "#ef4444" }} />
              <p className="text-[11px]" style={{ color: textMuted }}>
                {twoStep ? "Two-step verification is enabled" : "Your account is using single-factor authentication"}
              </p>
            </div>
          </SettingsCard>
        </div>

        {/* ── Shift Reminders & Active Period ── */}
        <div>
          <SettingsCard dark={dark}>
            <SectionHeader icon={Bell} title="Shift Reminders" subtitle="Configure notification preferences" dark={dark} />
            <SettingsRow label="Shift Reminders" description="Get notified before your shifts start" dark={dark}>
              <Toggle checked={shiftReminders} onChange={setShiftReminders} />
            </SettingsRow>
            <SettingsRow label="Reminder Time" description="How far in advance to be notified" dark={dark}>
              <select
                className="text-[12px] px-3 py-1.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"}`,
                  color: textMain,
                  outline: "none",
                }}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60" selected>1 hour</option>
                <option value="120">2 hours</option>
                <option value="1440">1 day</option>
              </select>
            </SettingsRow>

            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}` }}>
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-4 h-4" style={{ color: "var(--tc-primary)" }} />
                <p className="text-sm font-semibold" style={{ color: textMain }}>Active Period</p>
              </div>
              <p className="text-[11px] mb-3" style={{ color: textMuted }}>Set your working hours for shift availability</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-medium" style={{ color: textMuted }}>Start</label>
                  <input
                    type="time"
                    value={activeStart}
                    onChange={e => setActiveStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-[13px]"
                    style={{
                      background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"}`,
                      color: textMain,
                      outline: "none",
                    }}
                  />
                </div>
                <span className="text-sm mt-4" style={{ color: textMuted }}>to</span>
                <div className="flex-1">
                  <label className="text-[10px] font-medium" style={{ color: textMuted }}>End</label>
                  <input
                    type="time"
                    value={activeEnd}
                    onChange={e => setActiveEnd(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-[13px]"
                    style={{
                      background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"}`,
                      color: textMain,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* ── Background Settings ── */}
        <div>
          <SettingsCard dark={dark}>
            <SectionHeader icon={ImageIcon} title="Background Settings" subtitle="Customize the portal background" dark={dark} />
            <SettingsRow label="Auto-Change Background" description="Randomly rotate background effects every minute" dark={dark}>
              <Toggle checked={autoBg} onChange={setAutoBg} />
            </SettingsRow>

            {!autoBg && !customBgUrl && (
              <div className="mt-4 pb-4" style={{ borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}` }}>
                <p className="text-[12px] font-medium mb-3" style={{ color: textMain }}>Dynamic Presets</p>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setBgIndex(i)}
                      className="w-24 h-16 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-[11px]"
                      style={{
                        background: bgIndex === i ? "var(--tc-primary)" : (dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
                        color: bgIndex === i ? "#fff" : textMuted,
                        border: `2px solid ${bgIndex === i ? "var(--tc-primary)" : "transparent"}`,
                        cursor: "pointer",
                      }}
                    >
                      Preset {i + 1}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="text-[12px] font-medium mb-3" style={{ color: textMain }}>Custom Background</p>
              {customBgUrl ? (
                <div className="relative rounded-xl overflow-hidden" style={{ height: 120 }}>
                  <img
                    src={customBgUrl}
                    alt="Custom background"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: "inherit" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBgUpload}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", backdropFilter: "blur(8px)" }}
                    >
                      <Upload className="w-3 h-3 inline mr-1" /> Change
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearCustomBg}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", backdropFilter: "blur(8px)" }}
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" /> Remove
                    </motion.button>
                  </div>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleBgUpload}
                  className="w-full py-8 rounded-xl flex flex-col items-center gap-2"
                  style={{
                    background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    border: `2px dashed ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                    color: textMuted,
                    cursor: "pointer",
                  }}
                >
                  <Upload className="w-6 h-6" style={{ color: "var(--tc-primary)" }} />
                  <span className="text-[12px] font-medium">
                    Click to upload a custom background
                  </span>
                  <span className="text-[10px]">
                    PNG, JPG, WEBP · Max 10MB
                  </span>
                </motion.button>
              )}
            </div>
          </SettingsCard>
        </div>

        {/* ── Notes with Calendar ── */}
        <div>
          <SettingsCard dark={dark}>
            <SectionHeader icon={StickyNote} title="Notes & Reminders" subtitle="Keep track of important dates and information" dark={dark} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Calendar */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" style={{ color: "var(--tc-primary)" }} />
                  <p className="text-[12px] font-semibold" style={{ color: textMain }}>Select Date</p>
                </div>
                {(() => {
                  const viewD = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
                  const yr = viewD.getFullYear();
                  const mo = viewD.getMonth();
                  const dim = new Date(yr, mo + 1, 0).getDate();
                  const fd = new Date(yr, mo, 1).getDay();
                  const moName = viewD.toLocaleString("default", { month: "long" });
                  const cells: (number | null)[] = [];
                  for (let i = 0; i < fd; i++) cells.push(null);
                  for (let d = 1; d <= dim; d++) cells.push(d);
                  const todayStr = new Date().toISOString().split("T")[0];
                  const prevM = () => { const d = new Date(yr, mo - 1, 1); setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`); };
                  const nextM = () => { const d = new Date(yr, mo + 1, 1); setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`); };
                  return (
                    <div className="admin-panel" style={{ position: "relative", borderRadius: 16, padding: 14 }}>
                      {/* Month nav */}
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={prevM} className="admin-panel" style={{ position: "relative", width: 26, height: 26, borderRadius: 8, border: "none", cursor: "pointer", color: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
                          <ChevronLeft size={14} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 800, color: textMain }}>{moName} {yr}</span>
                        <button onClick={nextM} className="admin-panel" style={{ position: "relative", width: 26, height: 26, borderRadius: 8, border: "none", cursor: "pointer", color: "var(--tc-primary)", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      {/* Day headers */}
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                          <div key={d} className="text-center" style={{ fontSize: 10, fontWeight: 700, color: textMuted, padding: "2px 0" }}>{d}</div>
                        ))}
                      </div>
                      {/* Day cells */}
                      <div className="grid grid-cols-7 gap-0.5">
                        {cells.map((day, idx) => {
                          if (!day) return <div key={`b-${idx}`} />;
                          const dateStr = `${yr}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                          const isSel = dateStr === selectedDate;
                          const isToday = dateStr === todayStr;
                          return (
                            <motion.button key={dateStr} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                              onClick={() => setSelectedDate(dateStr)}
                              style={{
                                width: "100%", aspectRatio: "1", borderRadius: 8, border: isToday && !isSel ? "1px solid var(--tc-primary)" : "none",
                                cursor: "pointer", fontSize: 12, fontWeight: isSel ? 700 : 400,
                                background: isSel ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" : isToday ? "color-mix(in srgb, var(--tc-primary) 10%, transparent)" : "transparent",
                                color: isSel ? "#fff" : isToday ? "var(--tc-primary)" : textMain,
                                boxShadow: isSel ? "0 4px 12px color-mix(in srgb, var(--tc-primary) 30%, transparent)" : "none",
                                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s",
                              }}>
                              {day}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                {/* Quick dates */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Today", "Tomorrow", "+1 Week"].map(label => {
                    const d = new Date();
                    if (label === "Tomorrow") d.setDate(d.getDate() + 1);
                    if (label === "+1 Week") d.setDate(d.getDate() + 7);
                    const dateStr = d.toISOString().split("T")[0];
                    const isActive = selectedDate === dateStr;
                    return (
                      <motion.button
                        key={label}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedDate(dateStr)}
                        className="px-3 py-1 rounded-lg text-[10px] font-semibold"
                        style={{
                          background: isActive ? "var(--tc-primary)" : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"),
                          color: isActive ? "#fff" : textMuted,
                          border: `1px solid ${isActive ? "transparent" : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")}`,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Notes with dates */}
                <div className="mt-3 space-y-1.5">
                  {notes.filter(n => n.text.trim()).length > 0 ? (
                    notes.filter(n => n.text.trim()).slice(0, 5).map(n => (
                      <div
                        key={n.id}
                        onClick={() => setSelectedDate(n.date)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                        style={{
                          background: selectedDate === n.date
                            ? "color-mix(in srgb, var(--tc-primary) 10%, transparent)"
                            : "transparent",
                          border: `1px solid ${selectedDate === n.date ? "color-mix(in srgb, var(--tc-primary) 20%, transparent)" : "transparent"}`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--tc-primary)" }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px]" style={{ color: textMuted }}>{n.date}</p>
                          <p className="text-[11px] truncate" style={{ color: textMain }}>{n.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] py-2" style={{ color: textMuted }}>No notes yet. Select a date and start typing.</p>
                  )}
                </div>
              </div>

              {/* Note editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold" style={{ color: textMain }}>
                    Notes for {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today"}
                  </p>
                </div>
                <textarea
                  value={currentNote?.text ?? ""}
                  onChange={e => updateNote(e.target.value)}
                  placeholder="Write your notes or reminders here..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl text-[13px] resize-none"
                  style={{
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
                    color: textMain,
                    outline: "none",
                    fontFamily: FONT_SYSTEM,
                    lineHeight: 1.6,
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px]" style={{ color: textMuted }}>
                    {(currentNote?.text ?? "").length} characters
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-[11px] font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                    style={{
                      background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                      color: "#fff",
                      cursor: "pointer",
                      border: "none",
                      boxShadow: "0 4px 12px color-mix(in srgb, var(--tc-primary) 30%, transparent)",
                    }}
                  >
                    <Check className="w-3 h-3" />
                    Save Note
                  </motion.button>
                </div>
              </div>
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
