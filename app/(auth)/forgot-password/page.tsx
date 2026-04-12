"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout3D } from "@/components/layout/AuthLayout3D";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      if (r.ok) setSent(true);
      else setError((d.message ?? "Failed. Try again.").toUpperCase());
    } catch {
      setError("NETWORK ERROR. CHECK YOUR CONNECTION.");
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
        <h1 className="text-white text-xl font-light tracking-[0.10em] mb-2 mt-4 text-center">FORGOT<br/>PASSWORD</h1>
        <p className="text-white/50 text-xs italic mb-8">Enter your email to receive a reset link</p>
        
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-3/4 relative z-20 text-center">
              <h2 className="text-[#fbbb29] text-sm mb-4 uppercase tracking-widest">Request Received</h2>
              <p className="text-white/60 text-xs mb-6">If an account exists, a password reset link has been sent to that email address. Please check your inbox.</p>
              
              <Link href="/login" className="mt-2 w-[120px] h-[34px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold tracking-wide flex items-center justify-center transition-all">
                <ArrowLeft size={14} className="mr-2" /> Back
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

              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your registered email"
                className="w-[280px] h-[42px] px-6 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06]"
              />

              <div className="w-[280px] flex justify-center mt-4">
                 <button
                   type="submit"
                   disabled={loading}
                   className="w-[120px] h-[34px] rounded-full bg-white text-black text-xs font-semibold tracking-wide flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                   {loading ? "..." : "Send Link"}
                 </button>
              </div>
              
              <div className="mt-4">
                 <Link href="/login" className="text-white/40 hover:text-white text-xs italic transition-colors flex items-center">
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
