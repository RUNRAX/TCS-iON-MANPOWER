"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Image from "next/image";

export default function SuperLoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Access denied. Invalid credentials.");
      setLoading(false);
      return;
    }

    const role = data.user?.app_metadata?.role as string | undefined;

    // ✅ ONLY super_admin gets through — everyone else is signed out immediately
    if (role !== "super_admin") {
      await supabase.auth.signOut();
      setError(
        "Access denied. This portal is restricted to Master Admin only."
      );
      setLoading(false);
      return;
    }

    // super_admin → Master Control dashboard
    router.push("/super/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070a] px-4 overflow-hidden relative">
      {/* Absolute Ambient Background Container */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/super-bg.png"
          alt="Sci-Fi Structure Background"
          fill
          className="object-cover opacity-80 mix-blend-lighten"
          priority
        />
        
        {/* Animated Flowing Gap Lights - simulating neon light flowing down background structural grooves */}
        <motion.div 
          animate={{ x: [-800, 800], y: [-800, 800], opacity: [0, 1, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
          className="absolute top-[20%] left-0 w-[600px] h-[3px] bg-cyan-400 shadow-[0_0_20px_#22d3ee] rotate-45 pointer-events-none mix-blend-screen"
        />
        <motion.div 
          animate={{ x: [800, -800], y: [800, -800], opacity: [0, 0.8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2.5 }}
          className="absolute bottom-0 right-0 w-[400px] h-[4px] bg-red-500 shadow-[0_0_20px_#ef4444] -rotate-45 pointer-events-none mix-blend-screen"
        />
        <motion.div 
          animate={{ x: [-600, 600], y: [600, -600], opacity: [0, 1, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 0.5 }}
          className="absolute bottom-[30%] left-[-20%] w-[350px] h-[2px] bg-blue-500 shadow-[0_0_15px_#3b82f6] -rotate-[35deg] pointer-events-none mix-blend-screen"
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] min-h-[580px] flex mx-auto">
        
        {/* Left Side Floating Decorator Diamonds */}
        <div className="absolute left-[-28px] top-[18%] flex flex-col gap-2 z-20 pointer-events-none">
          {[1,2,3,4].map((i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className="w-12 h-[68px] bg-white/[0.015] backdrop-blur-[6px] border border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
              style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
            />
          ))}
        </div>

        {/* Main Glassmorphic High-Tech Clip-Path Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full h-full bg-white/[0.04] backdrop-blur-xl border border-white/10 p-12 pr-14 flex flex-col justify-center overflow-visible"
          style={{ clipPath: "polygon(14% 0, 100% 0, 100% 86%, 86% 100%, 0 100%, 0 14%)" }}
        >
          {/* Subtle Stardust/Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
          
          <div className="relative z-10 w-full mb-8 mt-2">
            <h1 className="text-3xl font-extrabold text-white tracking-wide mb-2">Master Control</h1>
            <p className="text-[9px] text-gray-400 font-mono leading-relaxed max-w-[90%] uppercase">
              Mainframe access is highly restricted. <br/>
              Attempts without proper security clearance are subject to strict penal action.
            </p>
          </div>

          <div className="w-full h-px bg-white/10 mb-8 relative z-10" />

          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 w-full rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-xs text-center relative z-10 font-mono">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 w-full relative z-10 flex flex-col">
            <div className="w-full flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white tracking-widest uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full bg-[#1b1b1e] rounded-xl px-4 py-3.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] border border-white/5"
              />
            </div>

            <div className="w-full flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white tracking-widest uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full bg-[#1b1b1e] rounded-xl px-4 py-3.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] border border-white/5"
              />
            </div>

            <div className="w-full pt-4 flex justify-center pb-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-3.5 rounded-full transition-all flex items-center justify-center hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.4)] disabled:opacity-50"
              >
                {loading ? "Accessing Matrix..." : "Login"}
              </motion.button>
            </div>
          </form>
          
        </motion.div>

        {/* Bottom external glass accents fitting perfectly beneath the bottom-right chamfer */}
        <div className="absolute right-[5px] bottom-[-20px] flex gap-2 z-20 pointer-events-none">
            {[1,2,3].map((i) => (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                key={i} 
                className="w-[50px] h-3 bg-white/[0.05] backdrop-blur-[6px] border border-white/20 skew-x-[45deg] shadow-lg" 
              />
            ))}
        </div>
      </div>
    </div>
  );
}
