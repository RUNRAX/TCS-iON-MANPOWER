"use client";
/**
 * app/(auth)/login/page.tsx — iOS 26.4 "Liquid Glass" Login
 *
 * Implements:
 *   • Multi-layer 3D glass card (blur + fill + edge lighting)
 *   • Spring-physics submit button with glow pulse
 *   • Floating animated background cubes + orbs
 *   • Apple system font stack
 *   • 8pt grid spacing throughout
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { Eye, EyeOff, Building2, Shield, Fingerprint } from "lucide-react";
import ThemePanel from "@/components/ThemePanel";
import { SceneBackground, GlassCard, GlassBadge } from "@/components/ui/glass3d";

/* ── Apple edge shadow token ─────────────────────────────────────────────── */
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

/* ── Input edge shadow ───────────────────────────────────────────────────── */
const makeInputShadow = (dark: boolean, focused: boolean) => {
  const base = dark
    ? [
        "inset 0 1px 0 rgba(255,255,255,0.10)",
        "inset 0 -1px 0 rgba(0,0,0,0.14)",
        "0 2px 8px -2px rgba(0,0,0,0.22)",
      ]
    : [
        "inset 0 1.5px 0 rgba(255,255,255,0.95)",
        "inset 0 -1px 0 rgba(0,0,0,0.04)",
        "0 2px 6px -2px rgba(0,0,0,0.08)",
      ];
  if (focused) {
    base.push("0 0 0 3px color-mix(in srgb, var(--tc-primary) 18%, transparent)");
    base.push("0 4px 18px -4px color-mix(in srgb, var(--tc-primary) 28%, transparent)");
  }
  return base.join(", ");
};

export default function LoginPage() {
  const { dark } = useTheme();
  const [id,       setId]      = useState("");
  const [pw,       setPw]      = useState("");
  const [showPw,   setShowPw]  = useState(false);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const [mounted,  setMounted] = useState(false);
  const [focusedId, setFocusedId] = useState(false);
  const [focusedPw, setFocusedPw] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: id, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data.message ?? "Invalid credentials").toUpperCase());
        return;
      }
      window.location.href = data.data.redirectTo;
    } catch {
      setError("NETWORK ERROR. CHECK YOUR CONNECTION.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Design tokens ── */
  const bg = dark
    ? "linear-gradient(135deg, #050505 0%, #111111 40%, #0a0a0a 100%)"
    : "linear-gradient(135deg, #f5f5f5 0%, #eaeaea 40%, #ffffff 100%)";
  const cardBg    = dark ? "rgba(8,6,22,0.86)"  : "rgba(255,255,255,0.30)";
  const textMain  = dark ? "#f0eeff"            : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.44)" : "rgba(30,20,80,0.40)";
  const inputBg   = dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.25)";
  const inputBorder = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.09)";

  const FONT_SYSTEM = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', sans-serif";
  const FONT_DISPLAY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif";
  const BLUR_CARD  = "blur(56px) saturate(220%) brightness(1.07)";

  return (
    <div
      style={{
        minHeight:      "100vh",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        24,
        position:       "relative",
        overflow:       "hidden",
        transition:     "background 0.5s ease",
      }}
    >
      {/* ── Live Background ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#ff4b1f] to-[#ff9068] blur-[100px] opacity-40 animate-float-slow" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-[#ff9068] to-[#ff4b1f] blur-[100px] opacity-30 animate-float-delayed" />
        <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-bl from-[#ff4b1f] to-[#ff9068] blur-[100px] opacity-20 animate-float-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Theme toggle — fixed top right */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
        <ThemePanel size="md" />
      </div>

      {/* ── Login Card ── */}
      <GlassCard
        depth={12}
        levitate={false}
        noTilt
        className="w-full rounded-3xl"
        style={{ maxWidth: 440, zIndex: 10 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 28, scale: mounted ? 1 : 0.96 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 bg-white/5 dark:bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
          style={{
            padding: 44,
            overflow: "hidden",
          }}
        >
          {/* Card inner top sheen */}
          <div
            aria-hidden
            style={{
              position:   "absolute",
              top: 0, left: 0, right: 0,
              height:     "35%",
              background: dark
                ? "linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, transparent 100%)"
                : "linear-gradient(to bottom, rgba(255,255,255,0.80) 0%, transparent 100%)",
              pointerEvents: "none",
              borderRadius:  "inherit",
            }}
          />

          {/* ── Logo block ── */}
          <div style={{ textAlign: "center", marginBottom: 40, position: "relative", zIndex: 1 }}>
            {/* App icon — pulsing glow */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                  "0 0 48px color-mix(in srgb, var(--tc-primary) 22%, transparent), 0 0 80px color-mix(in srgb, var(--tc-secondary) 12%, transparent)",
                  "0 0 20px color-mix(in srgb, var(--tc-primary) 35%, transparent)",
                ],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 64, height: 64,
                borderRadius: 18,
                background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                /* 3-layer glass button face */
                boxShadow: [
                  "inset 0 2px 0 rgba(255,255,255,0.28)",
                  "inset 0 -1.5px 0 rgba(0,0,0,0.20)",
                  "0 0 24px color-mix(in srgb, var(--tc-primary) 38%, transparent)",
                ].join(", "),
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                margin:         "0 auto 20px",
              }}
            >
              <Building2 size={26} color="#fff" />
            </motion.div>

            <div
              style={{
                fontSize: 10, letterSpacing: 5,
                color: "var(--tc-primary)",
                fontFamily: "'Bebas Neue', 'SF Mono', monospace",
                marginBottom: 8, opacity: 0.85,
              }}
            >
              TCS ION · MANPOWER
            </div>
            <h1
              style={{
                fontSize: 30, fontWeight: 800,
                color:      textMain,
                letterSpacing: -0.5,
                fontFamily: FONT_DISPLAY,
                lineHeight: 1.1, margin: 0,
              }}
            >
              Welcome Back
            </h1>
            <p style={{ fontSize: 13, color: textMuted, marginTop: 6, fontFamily: FONT_SYSTEM }}>
              Sign in to your account
            </p>
          </div>

          {/* ── Error banner ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, y: 0,  height: "auto", marginBottom: 18 }}
                exit={{    opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  padding:      "10px 14px",
                  borderRadius: 12,
                  background:   "rgba(239,68,68,0.12)",
                  border:       "1px solid rgba(239,68,68,0.28)",
                  boxShadow:    "inset 0 1px 0 rgba(255,255,255,0.06)",
                  color:        "#fca5a5",
                  fontSize:     12,
                  textAlign:    "center",
                  fontFamily:   "'Bebas Neue', monospace",
                  letterSpacing: 1.2,
                  position:     "relative",
                  zIndex:       1,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Form ── */}
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 1 }}
          >
            {/* Email / Phone field */}
            <div>
              <label style={{
                display: "block", fontSize: 9, fontWeight: 700,
                color: focusedId ? "var(--tc-primary)" : textMuted,
                letterSpacing: 2.5, textTransform: "uppercase",
                marginBottom: 8,
                fontFamily: "'Bebas Neue', monospace",
                transition: "color 0.2s ease",
              }}>
                Email or Phone
              </label>
              <input
                type="text"
                value={id}
                required
                onChange={e => setId(e.target.value)}
                placeholder="admin@example.com"
                onFocus={() => setFocusedId(true)}
                onBlur={() => setFocusedId(false)}
                className="bg-white/5 border border-white/10"
                style={{
                  width:        "100%",
                  padding:      "14px 16px",
                  borderRadius: 14,
                  color:        textMain,
                  fontSize:     15,
                  outline:      "none",
                  fontFamily:   FONT_SYSTEM,
                  boxSizing:    "border-box",
                  boxShadow:    makeInputShadow(dark, focusedId),
                  backdropFilter: "blur(16px) saturate(160%)",
                  WebkitBackdropFilter: "blur(16px) saturate(160%)",
                  transition:   "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>

            {/* Password field */}
            <div>
              <label style={{
                display: "block", fontSize: 9, fontWeight: 700,
                color: focusedPw ? "var(--tc-primary)" : textMuted,
                letterSpacing: 2.5, textTransform: "uppercase",
                marginBottom: 8,
                fontFamily: "'Bebas Neue', monospace",
                transition: "color 0.2s ease",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  required
                  onChange={e => setPw(e.target.value)}
                  placeholder="••••••••"
                  onFocus={() => setFocusedPw(true)}
                  onBlur={() => setFocusedPw(false)}
                  className="bg-white/5 border border-white/10"
                  style={{
                    width:        "100%",
                    padding:      "14px 44px 14px 16px",
                    borderRadius: 14,
                    color:        textMain,
                    fontSize:     15,
                    outline:      "none",
                    fontFamily:   FONT_SYSTEM,
                    boxSizing:    "border-box",
                    boxShadow:    makeInputShadow(dark, focusedPw),
                    backdropFilter: "blur(16px) saturate(160%)",
                    WebkitBackdropFilter: "blur(16px) saturate(160%)",
                    transition:   "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  whileHover={{ scale: 1.10 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  style={{
                    position:   "absolute",
                    right:      12,
                    top:        "50%",
                    transform:  "translateY(-50%)",
                    background: "none",
                    border:     "none",
                    cursor:     "pointer",
                    color:      textMuted,
                    padding:    4,
                    display:    "flex",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--tc-primary)")}
                  onMouseLeave={e => (e.currentTarget.style.color = textMuted)}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </motion.button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginTop: -4 }}>
              <a
                href="/forgot-password"
                style={{
                  fontSize:      11,
                  color:         textMuted,
                  textDecoration: "none",
                  fontFamily:    FONT_SYSTEM,
                  transition:    "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--tc-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = textMuted)}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit button — 3-layer glass gradient */}
            <motion.button
              type="submit"
              disabled={loading || !id || !pw}
              whileHover={!loading && id && pw ? {
                y: -2, scale: 1.015,
                boxShadow: [
                  "inset 0 2px 0 rgba(255,255,255,0.28)",
                  "inset 0 -1px 0 rgba(0,0,0,0.18)",
                  "0 14px 48px color-mix(in srgb, var(--tc-primary) 55%, transparent)",
                  "0 4px 16px  color-mix(in srgb, var(--tc-primary) 28%, transparent)",
                ].join(", "),
              } : {}}
              whileTap={!loading && id && pw ? { scale: 0.96, y: 0 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              style={{
                marginTop:      10,
                width:          "100%",
                padding:        "16px 0",
                background:     "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                border:         "none",
                borderRadius:   16,
                color:          "#fff",
                fontFamily:     FONT_DISPLAY,
                fontSize:       15,
                fontWeight:     700,
                letterSpacing:  0.3,
                cursor:         loading || !id || !pw ? "not-allowed" : "pointer",
                /* 3-layer glass button edge lighting */
                boxShadow: [
                  "inset 0 2px 0 rgba(255,255,255,0.26)",
                  "inset 0 -1.5px 0 rgba(0,0,0,0.18)",
                  "0 8px 32px color-mix(in srgb, var(--tc-primary) 40%, transparent)",
                  "0 3px 10px color-mix(in srgb, var(--tc-primary) 22%, transparent)",
                ].join(", "),
                opacity:        loading || !id || !pw ? 0.55 : 1,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            10,
                transition:     "opacity 0.25s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.30)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin .7s linear infinite",
                  }} />
                  Signing in…
                </>
              ) : (
                <>
                  <Fingerprint size={17} />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Security footer */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 7px #10b98199",
              animation: "pulse 2.5s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: 10, color: textMuted,
              letterSpacing: 1.8,
              fontFamily: "'Bebas Neue', 'SF Mono', monospace",
            }}>
              AES-256 · TLS 1.3 · ENCRYPTED
            </span>
            <Shield size={10} style={{ color: textMuted, opacity: 0.55 }} />
          </div>
        </motion.div>
      </GlassCard>

      {/* Version watermark */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 0.25 : 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        style={{
          position: "fixed", bottom: 16,
          fontSize: 10, color: dark ? "#f0eeff" : "#0f0a2e",
          fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
          letterSpacing: 2,
        }}
      >
        TCS iON Manpower Portal · v26.4
      </motion.p>
    </div>
  );
}
