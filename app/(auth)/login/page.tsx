"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                        bg-orange-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14
                          bg-orange-500 rounded-2xl text-white font-black text-xl mb-4">
            T
          </div>
          <h1 className="text-2xl font-bold text-white">Staff Portal Login</h1>
          <p className="text-sm text-white/40 mt-1">Admin &amp; Employee Access</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8
                        backdrop-blur-xl shadow-2xl">

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30
                            text-red-400 text-sm leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-white/50
                                uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                           text-white placeholder-white/20 focus:outline-none
                           focus:border-orange-500/60 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50
                                uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                           text-white placeholder-white/20 focus:outline-none
                           focus:border-orange-500/60 transition-all"
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-orange-400/70 hover:text-orange-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50
                         text-white font-bold py-3.5 rounded-xl transition-all
                         active:scale-[0.98] shadow-lg shadow-orange-500/20"
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          {/* No register link — employees are created by admins */}
          <p className="text-center text-xs text-white/20 mt-6">
            Contact your administrator to get access.
          </p>
        </div>

        <p className="text-center text-xs text-white/10 mt-4">
          TCS iON Staff Portal © 2026
        </p>
      </div>
    </div>
  );
}
