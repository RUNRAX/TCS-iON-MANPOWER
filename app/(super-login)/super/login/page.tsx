"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

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
    <div className="min-h-screen flex items-center justify-center bg-[#050508] px-4 overflow-hidden relative">
      {/* Background Animated 3D Spheres - CENTER GLOW THEME */}
      <motion.div 
        animate={{ y: [-150, 150, -150], x: [-100, 100, -100] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[20%] w-64 h-64 rounded-full bg-[radial-gradient(circle_at_center,#ff6b6b_0%,#dc2626_30%,#991b1b_70%,#450a0a_100%)] shadow-[inset_0_0_60px_rgba(0,0,0,0.9),0_0_140px_rgba(153,27,27,0.8)]" 
      />
      <motion.div 
        animate={{ y: [150, -150, 150], x: [100, -100, 100] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[20%] w-80 h-80 rounded-full bg-[radial-gradient(circle_at_center,#ff4d4d_0%,#b91c1c_30%,#7f1d1d_70%,#2e0000_100%)] shadow-[inset_0_0_80px_rgba(0,0,0,0.9),0_0_180px_rgba(127,29,29,0.9)]" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], x: [-50, 50, -50], y: [-50, 50, -50] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] left-[45%] w-48 h-48 rounded-full bg-[radial-gradient(circle_at_center,#ff8f8f_0%,#ef4444_30%,#991b1b_70%,#450a0a_100%)] shadow-[inset_0_0_50px_rgba(0,0,0,0.9),0_0_120px_rgba(153,27,27,0.8)]" 
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphic Square Panel - Statically blurring, smoothly scaled */}
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="aspect-square w-full max-w-[420px] mx-auto flex flex-col items-center justify-center bg-white/[0.04] border border-red-500/10 rounded-[40px] p-8 backdrop-blur-[16px] shadow-2xl relative overflow-hidden"
        >
          {/* Inner ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />

          {/* Fading Content Container */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="w-full relative z-10 flex flex-col items-center"
          >
            <div className="text-center mb-8 relative z-10 w-full">
              <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">Master Control</h1>
              <p className="text-xs font-medium text-red-500 tracking-wide uppercase">Super Admin</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 w-full rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center relative z-10">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 w-full px-2 relative z-10">
              <motion.div whileHover={{ scale: 1.02 }} className="w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your mail here"
                  className="w-full bg-[#f3efe6] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium shadow-inner"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="w-full">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="your password here"
                  className="w-full bg-[#f3efe6] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium shadow-inner"
                />
              </motion.div>

              <div className="flex justify-end pt-1 w-full">
                <span className="text-[11px] text-red-400/80 hover:text-red-300 transition-colors cursor-pointer">
                  restricted access
                </span>
              </div>

              <div className="pt-6 flex justify-center w-full">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-[#f3efe6] hover:bg-white text-red-700 border border-white/20 disabled:opacity-50 font-bold py-3 rounded-xl transition-all shadow-lg backdrop-blur-md"
                >
                  {loading ? "Verifying..." : "Login"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        <p className="text-center text-xs text-white/10 mt-8 font-mono">
          TCSION · MASTER CONTROL · RESTRICTED
        </p>
      </div>
    </div>
  );
}
