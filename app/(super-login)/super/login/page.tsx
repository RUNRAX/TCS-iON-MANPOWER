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
      {/* Background Animated Squares - RED THEME */}
      <motion.div 
        animate={{ y: [-30, 30, -30], rotate: [0, 45, 90] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[10%] left-[15%] w-72 h-72 bg-red-600/30 rounded-[40px] blur-[60px]" 
      />
      <motion.div 
        animate={{ y: [30, -30, 30], rotate: [90, 45, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[10%] right-[15%] w-80 h-80 bg-red-800/20 rounded-[40px] blur-[80px]" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[40%] left-[55%] w-48 h-48 bg-orange-700/15 rounded-3xl blur-[50px]" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Glassmorphic Square Panel */}
        <div className="aspect-square w-full max-w-[420px] mx-auto flex flex-col items-center justify-center bg-white/[0.03] border border-red-500/10 rounded-[40px] p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          {/* Inner ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
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

            <div className="flex justify-end pt-1">
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
        </div>
        <p className="text-center text-xs text-white/10 mt-8 font-mono">
          TCSION · MASTER CONTROL · RESTRICTED
        </p>
      </motion.div>
    </div>
  );
}
