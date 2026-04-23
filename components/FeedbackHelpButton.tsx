"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Shield, Mail, ExternalLink, Database, Eye, Lock, UserCheck, Globe } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { usePathname } from "next/navigation";

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      "Personal identifiers: full name, email address, phone number, and employee ID provided during registration.",
      "Authentication data: hashed passwords and session tokens — never stored in plain text.",
      "Usage data: pages visited, features used, and interaction timestamps to improve platform performance.",
      "Device information: browser type, operating system, and IP address for security monitoring.",
    ],
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      "To authenticate your identity and grant role-appropriate access (Employee, Admin, Super Admin).",
      "To send shift notifications, schedules, and operational updates via WhatsApp or email.",
      "To generate attendance records, payment reports, and compliance documentation.",
      "To monitor platform security and detect fraudulent or unauthorized access attempts.",
    ],
  },
  {
    icon: Lock,
    title: "Data Security",
    content: [
      "All data is transmitted over HTTPS using TLS 1.3 encryption.",
      "Passwords are hashed using industry-standard bcrypt with a salt factor of 12.",
      "Database access is restricted to authorized server-side processes only — never exposed to the client.",
      "Session tokens expire automatically and are invalidated on logout.",
    ],
  },
  {
    icon: UserCheck,
    title: "Your Rights",
    content: [
      "You have the right to request a copy of all personal data we hold about you.",
      "You may request correction of inaccurate or outdated information at any time.",
      "You may request deletion of your account and associated data — subject to legal retention requirements.",
      "You may opt out of non-essential communications at any time through your account settings.",
    ],
  },
  {
    icon: Globe,
    title: "Third-Party Services",
    content: [
      "We use Supabase (supabase.com) for secure, GDPR-compliant database hosting.",
      "WhatsApp notifications are delivered via approved business API integrations.",
      "Payment reference data is processed in compliance with applicable financial regulations.",
      "We do not sell, rent, or share your data with advertisers or unaffiliated third parties.",
    ],
  },
  {
    icon: Shield,
    title: "Policy Updates",
    content: [
      "We may update this Privacy Policy periodically to reflect changes in law or our practices.",
      "Material changes will be communicated via email to registered users.",
      "Continued use of the platform after updates constitutes acceptance of the revised policy.",
      "The effective date of the current policy version is displayed at the bottom of this page.",
    ],
  },
];

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
    `?subject=Issue%20Report%20%E2%80%94%20TCS%20iON%20Staff%20Portal` +
    `&body=Please%20describe%20your%20issue%20below%3A%0A%0A` +
    `----%0A` +
    `Page%3A%20${encodeURIComponent(typeof window !== "undefined" ? window.location.href : pathname)}%0A` +
    `Role%3A%20${encodeURIComponent(roleLabel)}%0A` +
    `Time%3A%20${encodeURIComponent(now)}`;

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
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8"
            style={{
              background: dark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[24px]"
              style={{
                background: modalBg,
                border: `1px solid ${borderCol}`,
                backdropFilter: "blur(48px) saturate(200%)",
                WebkitBackdropFilter: "blur(48px) saturate(200%)",
                boxShadow: dark
                  ? "inset 0 1.5px 2px rgba(255,255,255,0.1), 0 24px 64px rgba(0,0,0,0.6)"
                  : "inset 0 1.5px 2px rgba(255,255,255,0.9), 0 16px 48px rgba(0,0,0,0.1)",
              }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b" style={{ borderColor: borderCol, background: dark ? "rgba(18, 14, 25, 0.85)" : "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" }}>
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: textMain }}>Privacy Policy</h2>
                    <p className="text-xs" style={{ color: textMuted }}>TCS iON Staff Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {sections.map((section, i) => (
                  <div
                    key={section.title}
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderCol}`,
                      borderRadius: 16,
                      padding: "20px 24px",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "color-mix(in srgb, var(--tc-primary) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)" }}>
                        <section.icon className="w-4 h-4" style={{ color: "var(--tc-primary)" }} />
                      </div>
                      <h3 className="text-base font-bold" style={{ color: textMain }}>{section.title}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {section.content.map((item, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--tc-primary)" }} />
                          <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div onClick={() => { window.location.href = mailtoHref; setOpen(false); }}>
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
