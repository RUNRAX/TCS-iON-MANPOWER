"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
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
    <div className="relative min-h-screen w-full bg-[#070707] flex items-center justify-center overflow-hidden font-sans">
      {/* ── 3D Decorative Elements ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-[500px] h-[500px]">
          
          {/* Top Left Red Angled Bar */}
          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [-40, -35, -40] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[0%] w-6 h-20 rounded-md bg-gradient-to-br from-[#ff4d79] to-[#c3144a]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.4)"
            }}
          />

          {/* Small Red Sphere Left */}
          <motion.div
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[50%] left-[-8%] w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4d79] to-[#c3144a]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.5)"
            }}
          />

          {/* Bottom Left Yellow Cylinder */}
          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [45, 50, 45] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[20%] left-[5%] w-8 h-24 rounded-full bg-gradient-to-br from-[#ffd54f] to-[#e6a000]"
            style={{
              boxShadow: "inset -3px -3px 8px rgba(0,0,0,0.3), inset 3px 3px 8px rgba(255,255,255,0.6)"
            }}
          />

          {/* Top Right Yellow Arc */}
          <motion.div
            animate={{ y: [4, -4, 4], rotate: [-20, -15, -20] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[12%] right-[12%] w-16 h-8 rounded-t-full bg-gradient-to-br from-[#ffd54f] to-[#e6a000]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.6)"
            }}
          />

          {/* Right Red Capsule */}
          <motion.div
            animate={{ y: [-8, 8, -8], rotate: [30, 25, 30] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[25%] right-[-10%] w-24 h-40 rounded-full bg-gradient-to-br from-[#ff4d79] to-[#c3144a]"
            style={{
              boxShadow: "inset -6px -6px 16px rgba(0,0,0,0.3), inset 6px 6px 16px rgba(255,255,255,0.5), 0 10px 20px rgba(0,0,0,0.4)"
            }}
          />

          {/* Bottom Right Small Yellow Cylinder */}
          <motion.div
            animate={{ y: [3, -3, 3], rotate: [30, 35, 30] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[25%] right-[2%] w-5 h-12 rounded-full bg-gradient-to-br from-[#ffd54f] to-[#e6a000]"
            style={{
              boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.6)"
            }}
          />

          {/* Bottom Right Huge Shadow Sphere */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-15%] right-[5%] w-48 h-48 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#050505]"
            style={{
              boxShadow: "inset -5px -5px 15px rgba(0,0,0,0.8), inset 5px 5px 15px rgba(255,255,255,0.05)"
            }}
          />

          {/* Bottom Center Red Sphere */}
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[5%] left-[40%] w-32 h-32 rounded-full z-20 bg-gradient-to-br from-[#ff6b9e] to-[#ba0f3e]"
            style={{
              boxShadow: "inset -8px -8px 20px rgba(0,0,0,0.3), inset 8px 8px 20px rgba(255,255,255,0.6), 0 10px 30px rgba(0,0,0,0.5)"
            }}
          />

        </div>
      </div>

      {/* ── Crown Icon Logo ── */}
      <div className="absolute bottom-10 left-10 w-14 h-14 rounded-full bg-[#111] flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-white/5">
        <Crown size={24} className="text-[#fbbb29] fill-[#fbbb29]" />
      </div>

      {/* ── Center Glass Circle Form ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-[420px] h-[420px] rounded-full flex flex-col items-center justify-center border-[1.5px] border-white/20 backdrop-blur-xl bg-white/[0.04]"
        style={{
          boxShadow: "0 0 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.05)"
        }}
      >
        <h1 className="text-white text-xl font-light tracking-[0.15em] mb-8">LOGIN</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col items-center w-3/4 gap-4 relative z-20">
          
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
            type="text"
            required
            value={id}
            onChange={e => setId(e.target.value)}
            placeholder="Your mail here"
            className="w-[280px] h-[42px] px-6 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06]"
          />

          <input
            type="password"
            required
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Your password here"
            className="w-[280px] h-[42px] px-6 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06]"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-[100px] h-[34px] rounded-full bg-white text-black text-xs font-semibold tracking-wide flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Login"}
          </button>
        </form>

      </motion.div>
    </div>
  );
}
