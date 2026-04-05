"use client";
import { useEffect, useState, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { SceneBackground, GlassCard } from "@/components/ui/glass3d";
import ThemePanel from "@/components/ThemePanel";
import { CheckCircle, Shield, KeyRound, ArrowRight } from "lucide-react";
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

function ResetPasswordForm() {
  const { dark } = useTheme();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedInp, setFocusedInp] = useState<number | null>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Explicit token bypass if provided in link (resolves 'supabase.co not reachable')
    if (tokenHash && type === "recovery") {
      sb.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(({ error }) => {
        if (error) {
          setError(error.message.toUpperCase());
          setValidSession(false);
        } else {
          setValidSession(true);
        }
      });
    } else {
      // Fallback: Check if already verified and in an active session
      sb.auth.getSession().then(({ data: { session } }) => setValidSession(!!session));
    }
  }, [tokenHash, type]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("PASSWORDS DO NOT MATCH"); return; }
    if (password.length < 6) { setError("MINIMUM 6 CHARACTERS"); return; }
    setLoading(true);
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error: err } = await sb.auth.updateUser({ password });
    if (err) setError(err.message.toUpperCase());
    else {
      setDone(true);
      // Optional: automatically sign them out after reset so they log in fresh
      await sb.auth.signOut();
    }
    setLoading(false);
  }

  const strength = [password.length >= 6, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const strengthColors = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981"];
  const strengthLevel = strength.filter(Boolean).length;

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
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", color: "#34d399" }}
                >
                  <CheckCircle size={28} />
                </motion.div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: textMain, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Password Updated</h1>
                <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.7, marginBottom: 24, fontFamily: FONT_SYSTEM }}>
                  Your password has been changed successfully. You can now log in with your new credentials.
                </p>
                <Link href="/login">
                  <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FONT_DISPLAY, boxShadow: "0 8px 28px color-mix(in srgb, var(--tc-primary) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    Go to Login <ArrowRight size={15} />
                  </motion.button>
                </Link>
              </motion.div>
            ) : validSession === false ? (
              <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", color: "#ef4444" }}>
                  <Shield size={28} />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: textMain, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Link Expired</h1>
                <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.7, marginBottom: 24, fontFamily: FONT_SYSTEM }}>
                  This reset link has expired or is invalid. Please request a new one.
                </p>
                <Link href="/forgot-password">
                  <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FONT_DISPLAY, boxShadow: "0 8px 28px color-mix(in srgb, var(--tc-primary) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)" }}
                  >
                    Request New Link
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} style={{ position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                  <motion.div
                    animate={{ boxShadow: [ "0 0 20px color-mix(in srgb, var(--tc-primary) 35%, transparent)", "0 0 48px color-mix(in srgb, var(--tc-primary) 22%, transparent)", "0 0 20px color-mix(in srgb, var(--tc-primary) 35%, transparent)" ]}}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.28), 0 0 24px color-mix(in srgb, var(--tc-primary) 38%, transparent)" }}
                  >
                    <KeyRound size={22} color="#fff" />
                  </motion.div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: textMain, letterSpacing: -0.5, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Set New Password</h1>
                  <p style={{ fontSize: 14, color: textMuted, fontFamily: FONT_SYSTEM }}>Choose a strong password</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 10, fontFamily: FONT_SYSTEM }}>
                    <Shield size={16} /> {error}
                  </motion.div>
                )}

                <form onSubmit={submit}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 8, fontFamily: FONT_SYSTEM, marginLeft: 4 }}>New Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                        disabled={validSession !== true}
                        onFocus={() => setFocusedInp(1)} onBlur={() => setFocusedInp(null)}
                        style={{ width: "100%", padding: "14px 16px", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 14, color: textMain, fontSize: 14, fontFamily: FONT_SYSTEM, outline: "none", transition: "all 0.3s ease", boxShadow: makeInputShadow(dark, focusedInp === 1) }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 16 }}>{showPw ? "🙈" : "👁"}</button>
                    </div>
                    {password && (
                      <div style={{ display: "flex", gap: 4, marginTop: 8, padding: "0 4px" }}>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < strengthLevel ? strengthColors[strengthLevel - 1] : "rgba(255,255,255,0.1)", transition: "background 0.3s ease" }} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 8, fontFamily: FONT_SYSTEM, marginLeft: 4 }}>Confirm Password</label>
                    <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password"
                      disabled={validSession !== true}
                      onFocus={() => setFocusedInp(2)} onBlur={() => setFocusedInp(null)}
                      style={{ width: "100%", padding: "14px 16px", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 14, color: textMain, fontSize: 14, fontFamily: FONT_SYSTEM, outline: "none", transition: "all 0.3s ease", boxShadow: makeInputShadow(dark, focusedInp === 2) }}
                    />
                    {confirm && confirm !== password && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 8, marginLeft: 4, fontFamily: FONT_SYSTEM }}>Passwords do not match</div>}
                  </div>

                  <motion.button type="submit" disabled={loading || !password || password !== confirm || validSession !== true}
                    whileHover={{ scale: (loading || !password || password !== confirm || validSession !== true) ? 1 : 1.02, y: -2 }}
                    whileTap={{ scale: (loading || !password || password !== confirm || validSession !== true) ? 1 : 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))", border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: (loading || !password || password !== confirm || validSession !== true) ? "not-allowed" : "pointer", fontFamily: FONT_DISPLAY, opacity: (loading || !password || password !== confirm) ? 0.6 : 1, boxShadow: "0 8px 28px color-mix(in srgb, var(--tc-primary) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </GlassCard>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0a0a" }} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
