"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function LoginPage() {
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
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    const role = data.user?.app_metadata?.role as string | undefined;

    // ✅ BLOCK super_admin — sign them out and show error
    if (role === "super_admin") {
      await supabase.auth.signOut();
      setError(
        "This portal is for Admins and Employees only. Super Admin must use the Master Control portal."
      );
      setLoading(false);
      return;
    }

    // ✅ Role-aware redirect
    if (role === "admin") {
      router.push("/admin/dashboard");
    } else {
      // employee or any unrecognized role → safe default
      router.push("/employee/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 overflow-hidden relative">
      {/* Background Animated 3D Spheres */}
      <motion.div 
        animate={{ y: [-150, 150, -150], x: [-100, 100, -100] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[20%] w-64 h-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fdba74,#f97316_40%,#9a3412_90%)] shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.6),inset_10px_10px_30px_rgba(255,255,255,0.4),0_0_120px_rgba(234,88,12,0.8)]" 
      />
      <motion.div 
        animate={{ y: [150, -150, 150], x: [100, -100, 100] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[20%] w-80 h-80 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fcd34d,#f59e0b_40%,#b45309_90%)] shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.6),inset_10px_10px_30px_rgba(255,255,255,0.4),0_0_150px_rgba(245,158,11,0.8)]" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [-50, 50, -50], y: [-50, 50, -50] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] left-[45%] w-48 h-48 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fde047,#eab308_40%,#a16207_90%)] shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.6),inset_10px_10px_30px_rgba(255,255,255,0.4),0_0_100px_rgba(234,179,8,0.8)]" 
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphic Square Panel - Statically blurring, smoothly scaled */}
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="aspect-square w-full max-w-[420px] mx-auto flex flex-col items-center justify-center bg-white/[0.04] border border-white/10 rounded-[40px] p-8 backdrop-blur-[16px] shadow-2xl relative overflow-hidden"
        >
          {/* Inner ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />

          {/* Fading Content Container (delayed slightly perfectly for blur entrance) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="w-full relative z-10 flex flex-col items-center"
          >
            <div className="text-center mb-8 relative z-10 w-full">
              <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">Login</h1>
              <p className="text-xs font-medium text-orange-400 tracking-wide">Staff Portal</p>
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
                  className="w-full bg-[#f3efe6] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium shadow-inner"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="w-full">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="your password here"
                  className="w-full bg-[#f3efe6] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium shadow-inner"
                />
              </motion.div>

              <div className="flex justify-end pt-1 w-full">
                <Link href="/forgot-password" className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors">
                  forgot your password
                </Link>
              </div>

              <div className="pt-6 flex justify-center w-full">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-[#f3efe6] hover:bg-white text-orange-600 border border-white/20 disabled:opacity-50 font-bold py-3 rounded-xl transition-all shadow-lg backdrop-blur-md"
                >
                  {loading ? "Logging in..." : "Login"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        
        <p className="text-center text-xs text-white/20 mt-8">
          TCS iON Staff Portal © 2026
        </p>
      </div>
    </div>
  );
}
