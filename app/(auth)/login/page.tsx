"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout3D } from "@/components/layout/AuthLayout3D";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Invalid credentials");
        return;
      }
      window.location.href = data.data.redirectTo;
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-white text-xl font-light tracking-[0.15em] mb-8 mt-4">LOGIN</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col items-center w-3/4 gap-4 relative z-20">
          


          <input
            type="text"
            required
            value={id}
            onChange={e => setId(e.target.value)}
            placeholder="Your mail here"
            className="w-[280px] h-[42px] px-6 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06]"
          />

          <div className="relative w-[280px]">
            <input
              type={showPw ? "text" : "password"}
              required
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Your password here"
              className="w-full h-[42px] pl-6 pr-12 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06]"
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

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="w-[280px] text-center text-xs text-[#ff4d79] mt-1"
              >
                Invalid Credentials
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-[280px] flex justify-end">
             <a href="/forgot-password" className="text-white/40 hover:text-white text-xs italic transition-colors">
               Forgot password?
             </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-[100px] h-[34px] rounded-full bg-white text-black text-xs font-semibold tracking-wide flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Login"}
          </button>
        </form>

      </motion.div>
    </AuthLayout3D>
  );
}
