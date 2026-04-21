"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { Shield, ArrowLeft, Mail, Lock, Eye, Database, UserCheck, Globe } from "lucide-react";

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

export default function PrivacyPolicyPage() {
  const { dark } = useTheme();

  const textMain = dark ? "rgba(255,255,255,0.95)" : "#0f0a2e";
  const textMuted = dark ? "rgba(255,255,255,0.5)" : "rgba(30,20,80,0.5)";
  const cardBg = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.60)";
  const borderCol = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  return (
    <div
      style={{
        minHeight: "100vh",
        overflowX: "hidden",
        background: dark
          ? "linear-gradient(135deg,#050505 0%,#111111 40%,#0a0a0a 100%)"
          : "linear-gradient(135deg,#f5f5f5 0%,#eaeaea 40%,#ffffff 100%)",
        color: textMain,
        transition: "background 0.5s ease, color 0.4s ease",
      }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            left: "5%", top: "10%", width: "40vw", height: "40vw",
            background: "radial-gradient(circle, color-mix(in srgb, var(--tc-primary) 12%, transparent) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            right: "5%", bottom: "15%", width: "35vw", height: "35vw",
            background: "radial-gradient(circle, color-mix(in srgb, var(--tc-secondary) 10%, transparent) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className="relative z-30 px-6 md:px-16 py-4 flex items-center justify-between sticky top-0"
        style={{
          borderBottom: `1px solid color-mix(in srgb, var(--tc-primary) 12%, transparent)`,
          backdropFilter: "blur(20px) saturate(250%)",
          background: dark ? "rgba(7,7,18,0.75)" : "rgba(240,238,255,0.40)",
        }}
      >
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ x: -3 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            style={{ color: "var(--tc-primary)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.div>
          <span
            className="text-sm font-semibold"
            style={{ color: textMuted, transition: "color 0.2s ease" }}
          >
            Back to Portal
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold" style={{ color: textMain }}>Privacy Policy</span>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 tracking-wide"
            style={{
              background: "color-mix(in srgb, var(--tc-primary) 9%, transparent)",
              border: "1px solid color-mix(in srgb, var(--tc-primary) 21%, transparent)",
              color: "var(--tc-primary)",
            }}
          >
            <Shield className="w-3 h-3" />
            TCS iON STAFF PORTAL
          </div>
          <h1
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
            style={{ color: textMain }}
          >
            Privacy Policy
          </h1>
          <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color: textMuted }}>
            This policy explains how TCS iON Staff Portal collects, uses, and protects
            your personal information. We are committed to handling your data with
            transparency and care.
          </p>
          <p className="text-xs mt-4 font-mono" style={{ color: textMuted }}>
            Effective Date: January 1, 2026 · Last Updated: April 2026
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: cardBg,
                border: `1px solid ${borderCol}`,
                borderRadius: 20,
                padding: "24px 28px",
                backdropFilter: "blur(24px) saturate(180%)",
                boxShadow: dark
                  ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.25)"
                  : "inset 0 1.5px 0 rgba(255,255,255,0.95), 0 4px 16px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 22%, transparent), color-mix(in srgb, var(--tc-secondary) 12%, transparent))",
                    border: "1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)",
                  }}
                >
                  <section.icon className="w-5 h-5" style={{ color: "var(--tc-primary)" }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: textMain }}>
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ background: "var(--tc-primary)" }}
                    />
                    <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact / Report */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 text-center"
          style={{
            background: "color-mix(in srgb, var(--tc-primary) 6%, transparent)",
            border: "1px solid color-mix(in srgb, var(--tc-primary) 15%, transparent)",
            borderRadius: 20,
            padding: "32px",
          }}
        >
          <Mail className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--tc-primary)" }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: textMain }}>
            Questions or Concerns?
          </h3>
          <p className="text-sm mb-5" style={{ color: textMuted }}>
            If you have any questions about this privacy policy or wish to exercise your data rights,
            please contact us directly.
          </p>
          <a
            href="mailto:rakshitawati11@gmail.com?subject=Privacy Policy Inquiry — TCS iON Staff Portal"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
              boxShadow: "0 0 20px color-mix(in srgb, var(--tc-primary) 30%, transparent)",
            }}
          >
            <Mail className="w-4 h-4" />
            Contact Us
          </a>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs mt-12" style={{ color: textMuted }}>
          TCS iON Staff Portal © 2026 · All rights reserved ·{" "}
          <Link
            href="/"
            className="hover:underline transition-colors"
            style={{ color: "var(--tc-primary)" }}
          >
            Return to Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
