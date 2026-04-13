"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="min-h-screen flex items-center justify-center bg-[#050508] px-4">
      {/* Different color scheme — visually distinct from regular login */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px]
                        bg-red-900/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px]
                        bg-orange-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14
                          bg-red-900/50 border border-red-700/40 rounded-2xl
                          text-red-400 font-black text-2xl mb-4">
            ⬡
          </div>
          <h1 className="text-2xl font-bold text-white">Master Control</h1>
          <p className="text-xs text-red-400/60 mt-1 font-mono tracking-widest uppercase">
            Restricted Access — Super Admin Only
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-red-900/30 rounded-2xl p-8
                        backdrop-blur-xl shadow-2xl shadow-red-900/10">

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30
                            text-red-400 text-sm leading-relaxed">
              🚫 {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-white/40
                                uppercase tracking-widest mb-2">
                Master Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="superadmin@tcsion.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                           text-white placeholder-white/15 focus:outline-none
                           focus:border-red-700/60 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40
                                uppercase tracking-widest mb-2">
                Master Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                           text-white placeholder-white/15 focus:outline-none
                           focus:border-red-700/60 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-900/60 hover:bg-red-800/70 border border-red-700/40
                         disabled:opacity-50 text-red-200 font-bold py-3.5 rounded-xl
                         transition-all active:scale-[0.98]"
            >
              {loading ? "Verifying..." : "Enter Master Control →"}
            </button>
          </form>

          {/* Intentionally bare — no links, no helpers */}
          <p className="text-center text-xs text-white/10 mt-6 font-mono">
            TCSION · MASTER CONTROL · RESTRICTED
          </p>
        </div>
      </div>
    </div>
  );
}
