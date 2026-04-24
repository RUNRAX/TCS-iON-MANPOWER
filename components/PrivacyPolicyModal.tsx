"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Database, Eye, Lock, UserCheck, Globe } from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";

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

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  const { dark } = useTheme();

  const borderCol = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const textMain = dark ? "rgba(255,255,255,0.95)" : "#0f0a2e";
  const textMuted = dark ? "rgba(255,255,255,0.50)" : "rgba(30,20,80,0.50)";
  const modalBg = dark ? "rgba(18, 14, 25, 0.65)" : "rgba(255, 255, 255, 0.60)";
  const cardBg = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.60)";

  return (
    <AnimatePresence>
      {isOpen && (
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
          onClick={onClose}
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
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {sections.map((section) => (
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
  );
}
