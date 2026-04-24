"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Shield, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { usePathname } from "next/navigation";
import PrivacyPolicyModal from "./PrivacyPolicyModal";



interface FeedbackHelpButtonProps {
  role?: "admin" | "employee" | "super_admin";
}

export default function FeedbackHelpButton({ role }: FeedbackHelpButtonProps) {
  const { dark } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Close on route change
  useEffect(() => {
    setOpen(false);
    setShowPrivacyModal(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open && !showPrivacyModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPrivacyModal) setShowPrivacyModal(false);
        else setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, showPrivacyModal]);

  const now = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const roleLabel = role === "super_admin"
    ? "Super Admin"
    : role === "admin"
      ? "Admin"
      : role === "employee"
        ? "Employee"
        : "Guest";

  const mailtoHref =
    `mailto:rakshitawati11@gmail.com` +
    `?subject=${encodeURIComponent(`Issue Report — TCS iON Staff Portal — ${roleLabel} — ${new Date().toLocaleDateString("en-IN")}`)}` +
    `&body=${encodeURIComponent(
      `Hi Super Admin,\n\n` +
      `I'd like to report the following issue:\n\n` +
      `Issue Description:\n[Please describe the issue you encountered]\n\n` +
      `Steps to Reproduce:\n1. \n2. \n3. \n\n` +
      `Expected Behavior:\n[What did you expect to happen?]\n\n` +
      `────────────────────────\n` +
      `Auto-captured Details (Do Not Edit)\n` +
      `────────────────────────\n` +
      `Page:        ${typeof window !== "undefined" ? window.location.href : pathname}\n` +
      `Role:        ${roleLabel}\n` +
      `Timestamp:   ${now}\n` +
      `Browser:     ${typeof window !== "undefined" ? navigator.userAgent : "Unknown"}\n` +
      `Portal:      TCS iON Staff Portal\n`
    )}`;

  const panelBg = dark
    ? "rgba(20,16,30,0.90)"
    : "rgba(255,255,255,0.92)";
  const borderCol = dark
    ? "rgba(255,255,255,0.12)"
    : "rgba(0,0,0,0.08)";
  const textMain = dark ? "rgba(255,255,255,0.95)" : "#0f0a2e";
  const textMuted = dark ? "rgba(255,255,255,0.50)" : "rgba(30,20,80,0.50)";
  const modalBg = dark ? "rgba(18, 14, 25, 0.65)" : "rgba(255, 255, 255, 0.60)";
  const cardBg = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.60)";

  return (
    <>
      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[998]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="fixed z-[999]"
            style={{
              bottom: "80px",
              right: "20px",
              width: "260px",
              background: panelBg,
              border: `1px solid ${borderCol}`,
              borderRadius: 20,
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              boxShadow: dark
                ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 64px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.04)"
                : "inset 0 1.5px 0 rgba(255,255,255,0.95), 0 12px 40px rgba(0,0,0,0.12)",
              padding: "20px",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                    boxShadow: "0 0 12px color-mix(in srgb, var(--tc-primary) 30%, transparent)",
                  }}
                >
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: textMain }}>
                    Help & Support
                  </p>
                  <p className="text-[10px]" style={{ color: textMuted }}>
                    TCS iON Staff Portal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  color: textMuted,
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: `linear-gradient(to right, transparent, ${borderCol}, transparent)`,
                marginBottom: 16,
              }}
            />

            {/* Options */}
            <div className="space-y-2.5">
              {/* Privacy Policy */}
              <div onClick={() => { setOpen(false); setShowPrivacyModal(true); }}>
                <motion.div
                  whileHover={{ x: 3, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer"
                  style={{
                    border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "color-mix(in srgb, var(--tc-primary) 14%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)",
                    }}
                  >
                    <Shield className="w-4 h-4" style={{ color: "var(--tc-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: textMain }}>
                      Privacy Policy
                    </p>
                    <p className="text-[10px]" style={{ color: textMuted }}>
                      How we use your data
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Report Issue */}
              <div onClick={() => { 
                try {
                  window.location.href = mailtoHref;
                } catch (e) {
                  navigator.clipboard.writeText("rakshitawati11@gmail.com");
                  alert("Copied support email to clipboard.");
                }
                setOpen(false); 
              }}>
                <motion.div
                  whileHover={{ x: 3, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer"
                  style={{
                    border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "color-mix(in srgb, var(--tc-secondary) 14%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--tc-secondary) 20%, transparent)",
                    }}
                  >
                    <Mail className="w-4 h-4" style={{ color: "var(--tc-secondary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: textMain }}>
                      Report an Issue
                    </p>
                    <p className="text-[10px]" style={{ color: textMuted }}>
                      Email us from your mail app
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textMuted }} />
                </motion.div>
              </div>
            </div>

            {/* Footer note */}
            <p
              className="text-[9px] text-center mt-4 leading-relaxed"
              style={{ color: textMuted }}
            >
              Issues are sent to rakshitawati11@gmail.com
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
        aria-label="Help and Support"
        className="fixed z-[997]"
        style={{
          bottom: "20px",
          right: "20px",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))"
            : dark
              ? "rgba(30,25,40,0.85)"
              : "rgba(255,255,255,0.90)",
          border: `1px solid ${open
            ? "transparent"
            : dark
              ? "rgba(255,255,255,0.14)"
              : "rgba(0,0,0,0.10)"}`,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: open
            ? "0 0 24px color-mix(in srgb, var(--tc-primary) 45%, transparent), 0 8px 24px rgba(0,0,0,0.35)"
            : dark
              ? "0 0 16px color-mix(in srgb, var(--tc-primary) 20%, transparent), 0 4px 16px rgba(0,0,0,0.45)"
              : "0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="help"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <HelpCircle
                className="w-5 h-5"
                style={{ color: dark ? "var(--tc-primary)" : "var(--tc-primary)" }}
              />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
