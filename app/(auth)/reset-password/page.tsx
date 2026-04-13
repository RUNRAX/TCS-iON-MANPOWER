"use client";
import { useEffect, useState, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout3D } from "@/components/layout/AuthLayout3D";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
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

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
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
      sb.auth.getSession().then(({ data: { session } }) => setValidSession(!!session));
    }
  }, [tokenHash, type]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setError("");
    if (password !== confirm) { setError("PASSWORDS DO NOT MATCH"); return; }
    if (password.length < 6) { setError("MINIMUM 6 CHARACTERS"); return; }
    setLoading(true);
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error: err } = await sb.auth.updateUser({ password });
    if (err) setError(err.message.toUpperCase());
    else {
      setDone(true);
      await sb.auth.signOut();
    }
    setLoading(false);
  }

  return (
    <AuthLayout3D>
      {/* ── Center Glass Square Form ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-[420px] pb-10 pt-10 rounded-[40px] flex flex-col items-center justify-center border-[1.5px] border-white/20 backdrop-blur-xl bg-white/[0.04]"
        style={{
          boxShadow: "0 0 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.05)"
        }}
      >
        <h1 className="text-white text-xl font-light tracking-[0.10em] mb-2 mt-4 text-center">RESET<br/>PASSWORD</h1>
        <p className="text-white/50 text-xs italic mb-8">Choose a strong new password</p>
        
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-3/4 relative z-20 text-center">
              <h2 className="text-[#10b981] text-sm mb-4">Password Updated!</h2>
              <p className="text-white/60 text-xs italic mb-6">You can now log in with your new credentials</p>
              
              <Link href="/" className="mt-2 w-[120px] h-[34px] rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold tracking-wide flex items-center justify-center transition-all">
                Go to Login
              </Link>
            </motion.div>
          ) : validSession === false ? (
            <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-3/4 relative z-20 text-center">
              <h2 className="text-[#ef4444] text-sm mb-4">Link Expired</h2>
              <p className="text-white/60 text-xs italic mb-6">This reset link has expired or is invalid.</p>
              
              <Link href="/forgot-password" className="mt-2 w-[140px] h-[34px] rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold tracking-wide flex items-center justify-center transition-all">
                Request New Link
              </Link>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} className="flex flex-col items-center w-3/4 gap-4 relative z-20">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute -top-10 text-xs text-[#ff4d79] bg-[#ff4d79]/10 px-3 py-1 rounded-full border border-[#ff4d79]/30"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative w-[280px]">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  disabled={validSession !== true}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password (min 6)"
                  className="w-full h-[42px] pl-6 pr-12 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>

              <input
                type="password"
                required
                disabled={validSession !== true}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="w-[280px] h-[42px] px-6 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06] disabled:opacity-50"
              />

              <div className="w-[280px] flex justify-center mt-4">
                 <button
                   type="submit"
                   disabled={loading || !password || password !== confirm || validSession !== true}
                   className="w-[140px] h-[34px] rounded-full bg-white text-black text-xs font-semibold tracking-wide flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                   {loading ? "..." : "Update Password"}
                 </button>
              </div>
              
              <div className="mt-4">
                 <Link href="/" className="text-white/40 hover:text-white text-xs italic transition-colors flex items-center">
                   <ArrowLeft size={12} className="mr-1" /> Back to login
                 </Link>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </AuthLayout3D>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
