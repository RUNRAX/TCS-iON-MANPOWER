"use client";
/**
 * app/(auth)/forgot-password/page.tsx — Glass Frost "Forgot Password"
 * 
 * Uses the same glass 3D styling as login page.
 * Flow: Enter email → Send reset link → Confirmation message
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { SceneBackground, GlassCard } from "@/components/ui/glass3d";
import ThemePanel from "@/components/ThemePanel";
import { Mail, ArrowLeft, Shield, CheckCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const makeEdge = (dark: boolean) =>
  dark
    ? [
        "inset 0 2px 0 rgba(255,255,255,0.20)",
        "inset 0 -1px 0 rgba(0,0,0,0.18)",
        "inset 1px 0 0 rgba(255,255,255,0.10)",
        "inset -1px 0 0 rgba(255,255,255,0.05)",
        "0 24px 80px -8px rgba(0,0,0,0.55)",
        "0 8px 32px -4px rgba(0,0,0,0.30)",
      ].join(", ")
    : [
        "inset 0 2px 0 rgba(255,255,255,0.98)",
        "inset 0 -1px 0 rgba(0,0,0,0.04)",
        "inset 1px 0 0 rgba(255,255,255,0.90)",
        "inset -1px 0 0 rgba(255,255,255,0.70)",
        "0 16px 64px -8px rgba(0,0,0,0.12)",
        "0 4px 16px -4px rgba(0,0,0,0.08)",
      ].join(", ");

const makeInputShadow = (dark: boolean, focused: boolean) => {
  const base = dark
    ? ["inset 0 1px 0 rgba(255,255,255,0.10)", "inset 0 -1px 0 rgba(0,0,0,0.14)", "0 2px 8px -2px rgba(0,0,0,0.22)"]
    : ["inset 0 1.5px 0 rgba(255,255,255,0.95)", "inset 0 -1px 0 rgba(0,0,0,0.04)", "0 2px 6px -2px rgba(0,0,0,0.08)"];
  if (focused) {
    base.push("0 0 0 3px color-mix(in srgb, var(--tc-primary) 18%, transparent)");
    base.push("0 4px 18px -4px color-mix(in srgb, var(--tc-primary) 28%, transparent)");
  }
  return base.join(", ");
};

export default function ForgotPasswordPage() {
  const { dark } = useTheme();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [focusedEmail, setFocusedEmail] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      if (r.ok) setSent(true);
      else setError((d.message ?? "FAILED. TRY AGAIN.").toUpperCase());
    } catch { setError("NETWORK ERROR. CHECK YOUR CONNECTION."); }
    setLoading(false);
  }

  const bg = dark
    ? "linear-gradient(135deg, #050505 0%, #111111 40%, #0a0a0a 100%)"
    : "linear-gradient(135deg, #f5f5f5 0%, #eaeaea 40%, #ffffff 100%)";
  const cardBg    = dark ? "rgba(8,6,22,0.86)"  : "rgba(255,255,255,0.30)";
  const textMain  = dark ? "#f0eeff"             : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.44)" : "rgba(30,20,80,0.40)";
  const inputBg   = dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.25)";
  const inputBorder = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.09)";
  const BLUR_CARD = "blur(56px) saturate(220%) brightness(1.07)";
  const FONT_SYSTEM  = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', sans-serif";
  const FONT_DISPLAY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden", background: bg, transition: "background 0.5s ease" }}>
      <SceneBackground cubeCount={5} showGrid />
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}><ThemePanel size="md" /></div>

      <GlassCard depth={12} levitate={false} noTilt className="w-full rounded-3xl" style={{ maxWidth: 440, zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 28, scale: mounted ? 1 : 0.96 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            padding: 44,
            background: cardBg, backdropFilter: BLUR_CARD, WebkitBackdropFilter: BLUR_CARD,
            borderRadius: "inherit",
            boxShadow: makeEdge(dark),
            border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.85)"}`,
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Top sheen */}
          <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: "35%", background: dark ? "linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)" : "linear-gradient(to bottom, rgba(255,255,255,0.80), transparent)", pointerEvents: "none", borderRadius: "inherit" }} />

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", color: "#34d399" }}
                >
                  <CheckCircle size={28} />
                </motion.div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: textMain, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Check Your Email</h1>
                <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.7, marginBottom: 8, fontFamily: FONT_SYSTEM }}>
                  We&apos;ve sent a password reset link to
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tc-primary)", fontFamily: "monospace", marginBottom: 20 }}>{email}</p>
                <p style={{ fontSize: 12, color: textMuted, marginBottom: 24, fontFamily: FONT_SYSTEM }}>
                  The link expires in 60 minutes.
                </p>

                <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", fontSize: 11, color: "#fbbf24", marginBottom: 20, letterSpacing: 0.5 }}>
                  Didn&apos;t receive it? Check your spam folder or try again.
                </div>

                <Link href="/login">
                  <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FONT_DISPLAY, boxShadow: "0 8px 28px color-mix(in srgb, var(--tc-primary) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <ArrowLeft size={15} /> Back to Login
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} style={{ position: "relative", zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                  <motion.div
                    animate={{ boxShadow: [
                      "0 0 20px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                      "0 0 48px color-mix(in srgb, var(--tc-primary) 22%, transparent)",
                      "0 0 20px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                    ]}}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.28), 0 0 24px color-mix(in srgb, var(--tc-primary) 38%, transparent)" }}
                  >
                    <Mail size={22} color="#fff" />
                  </motion.div>
                  <div style={{ fontSize: 10, letterSpacing: 5, color: "var(--tc-primary)", fontFamily: "'Bebas Neue', monospace", marginBottom: 8, opacity: 0.85 }}>
                    PASSWORD RECOVERY
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: textMain, fontFamily: FONT_DISPLAY, margin: 0, lineHeight: 1.1 }}>Forgot Password?</h1>
                  <p style={{ fontSize: 13, color: textMuted, marginTop: 8, fontFamily: FONT_SYSTEM }}>
                    Enter your email to receive a reset link
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 16 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                      style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#fca5a5", fontSize: 12, textAlign: "center", fontFamily: "'Bebas Neue', monospace", letterSpacing: 1.2 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: focusedEmail ? "var(--tc-primary)" : textMuted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'Bebas Neue', monospace", transition: "color 0.2s" }}>
                      Registered Email
                    </label>
                    <input
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      onFocus={() => setFocusedEmail(true)}
                      onBlur={() => setFocusedEmail(false)}
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: 14,
                        background: focusedEmail ? (dark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.96)") : inputBg,
                        border: `1px solid ${focusedEmail ? "var(--tc-primary)" : inputBorder}`,
                        color: textMain, fontSize: 15, outline: "none", fontFamily: FONT_SYSTEM,
                        boxSizing: "border-box",
                        boxShadow: makeInputShadow(dark, focusedEmail),
                        backdropFilter: "blur(16px) saturate(160%)", WebkitBackdropFilter: "blur(16px) saturate(160%)",
                        transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !email}
                    whileHover={!loading && email ? { y: -2, scale: 1.015, boxShadow: "inset 0 2px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18), 0 14px 48px color-mix(in srgb, var(--tc-primary) 55%, transparent), 0 4px 16px color-mix(in srgb, var(--tc-primary) 28%, transparent)" } : {}}
                    whileTap={!loading && email ? { scale: 0.96, y: 0 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    style={{
                      marginTop: 6, width: "100%", padding: "16px 0",
                      background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                      border: "none", borderRadius: 16, color: "#fff", fontFamily: FONT_DISPLAY,
                      fontSize: 15, fontWeight: 700, letterSpacing: 0.3,
                      cursor: loading || !email ? "not-allowed" : "pointer",
                      boxShadow: "inset 0 2px 0 rgba(255,255,255,0.26), inset 0 -1.5px 0 rgba(0,0,0,0.18), 0 8px 32px color-mix(in srgb, var(--tc-primary) 40%, transparent)",
                      opacity: loading || !email ? 0.55 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      transition: "opacity 0.25s",
                    }}
                  >
                    {loading ? (
                      <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.30)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />Sending…</>
                    ) : (
                      <><Send size={15} /> Send Reset Link</>
                    )}
                  </motion.button>
                </form>

                {/* Back to login */}
                <div style={{ marginTop: 24, textAlign: "center" }}>
                  <Link href="/login" style={{ fontSize: 12, color: textMuted, textDecoration: "none", fontFamily: FONT_SYSTEM, transition: "color 0.2s", display: "inline-flex", alignItems: "center", gap: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--tc-primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = textMuted)}
                  >
                    <ArrowLeft size={12} /> Back to Login
                  </Link>
                </div>

                {/* Security footer */}
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 7px #10b98199", animation: "pulse 2.5s ease-in-out infinite" }} />
                  <span style={{ fontSize: 10, color: textMuted, letterSpacing: 1.8, fontFamily: "'Bebas Neue', 'SF Mono', monospace" }}>
                    AES-256 · TLS 1.3 · ENCRYPTED
                  </span>
                  <Shield size={10} style={{ color: textMuted, opacity: 0.55 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </GlassCard>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 0.25 : 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        style={{ position: "fixed", bottom: 16, fontSize: 10, color: dark ? "#f0eeff" : "#0f0a2e", fontFamily: "'SF Mono', 'JetBrains Mono', monospace", letterSpacing: 2 }}
      >
        TCS iON Manpower Portal · v26.4
      </motion.p>
    </div>
  );
}
