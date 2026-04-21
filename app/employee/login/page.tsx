"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

export default function EmployeeLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Safely read query params without requiring a Suspense wrapper
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("verified") === "true") {
        setSuccessMsg("Email verified successfully! You can now log in.");
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, expected_role: "employee" }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Invalid credentials.");
        setLoading(false);
        return;
      }

      if (data.data?.redirectTo) {
        router.push(data.data.redirectTo);
      } else {
        router.push("/employee/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 overflow-hidden relative">
      <motion.div 
        animate={{ y: [-150, 150, -150], x: [-100, 100, -100] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[20%] w-64 h-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,#10b981,#059669_40%,#064e3b_90%)] shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.6),inset_10px_10px_30px_rgba(255,255,255,0.4),0_0_120px_rgba(5,150,105,0.8)]" 
      />
      <motion.div 
        animate={{ y: [150, -150, 150], x: [100, -100, 100] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[20%] w-80 h-80 rounded-full bg-[radial-gradient(circle_at_30%_30%,#34d399,#10b981_40%,#047857_90%)] shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.6),inset_10px_10px_30px_rgba(255,255,255,0.4),0_0_150px_rgba(16,185,129,0.8)]" 
      />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="relative w-full max-w-[420px] mx-auto">
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="aspect-square w-full flex flex-col items-center justify-center bg-white/[0.04] border border-white/10 rounded-[40px] p-8 backdrop-blur-[16px] shadow-2xl relative overflow-hidden"
          >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="w-full relative z-10 flex flex-col items-center"
          >
            <div className="text-center mb-8 relative z-10 w-full">
              <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">Login</h1>
              <p className="text-xs font-medium text-emerald-400 tracking-wide">Employee Portal</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 w-full rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center relative z-10">
                {error}
              </motion.div>
            )}

            <AnimatePresence>
              {successMsg && !error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-3 w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center relative z-10 flex flex-col items-center gap-1"
                >
                  <CheckCircle size={16} />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4 w-full px-2 relative z-10">
              <motion.div whileHover={{ scale: 1.02 }} className="w-full">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="email or phone number"
                  className="w-full bg-[#f3efe6] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium shadow-inner"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="w-full relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="password"
                  className="w-full bg-[#f3efe6] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium shadow-inner pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>

              <div className="flex justify-end pt-1 w-full">
                <Link href="/forgot-password" className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                  forgot your password
                </Link>
              </div>

              <div className="pt-6 flex justify-center w-full">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-[#f3efe6] hover:bg-white text-emerald-700 border border-white/20 disabled:opacity-50 font-bold py-3 rounded-xl transition-all shadow-lg backdrop-blur-md"
                >
                  {loading ? "Logging in..." : "Login"}
                </motion.button>
              </div>
            </form>
          </motion.div>
          </motion.div>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-center text-xs text-white/20">
            TCS iON Staff Portal © 2026
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              target="_blank"
              className="text-[11px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-white/10 text-[11px]">·</span>
            <a
              href={`mailto:rakshitawati11@gmail.com?subject=Issue%20Report%20%E2%80%94%20TCS%20iON%20Staff%20Portal&body=Please%20describe%20your%20issue%20below%3A%0A%0A----%0APortal%3A%20Employee%20Login%0A`}
              className="text-[11px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
            >
              Report an Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
