"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout3D } from "@/components/layout/AuthLayout3D";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setMsg({ type: "err", text: "PASSWORDS DO NOT MATCH" }); return; }
    if (form.newPassword.length < 6) { setMsg({ type: "err", text: "MINIMUM 6 CHARACTERS REQUIRED" }); return; }
    setSaving(true); setMsg(null);
    const r = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
    const d = await r.json();
    if (r.ok) { setMsg({ type: "ok", text: "PASSWORD CHANGED SUCCESSFULLY. REDIRECTING..." }); setTimeout(() => router.back(), 1800); }
    else setMsg({ type: "err", text: (d.error ?? "FAILED TO CHANGE PASSWORD").toUpperCase() });
    setSaving(false);
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
        <h1 className="text-white text-xl font-light tracking-[0.10em] mb-2 mt-4 text-center">CHANGE<br/>PASSWORD</h1>
        <p className="text-white/50 text-xs italic mb-8">Update your account security</p>
        
        <form onSubmit={submit} className="flex flex-col items-center w-3/4 gap-4 relative z-20">
          <AnimatePresence>
            {msg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute -top-10 text-xs px-3 py-1 rounded-full border ${msg.type === "ok" ? "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30" : "text-[#ff4d79] bg-[#ff4d79]/10 border-[#ff4d79]/30"}`}
              >
                {msg.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative w-[280px]">
            <input
              type={showCurrent ? "text" : "password"}
              required
              value={form.currentPassword}
              onChange={f("currentPassword")}
              placeholder="Current password"
              className="w-full h-[42px] pl-6 pr-12 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showCurrent ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <div className="relative w-[280px]">
            <input
              type={showNew ? "text" : "password"}
              required
              value={form.newPassword}
              onChange={f("newPassword")}
              placeholder="New password (min 6)"
              className="w-full h-[42px] pl-6 pr-12 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06]"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showNew ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={f("confirmPassword")}
            placeholder="Confirm new password"
            className="w-[280px] h-[42px] px-6 rounded-full bg-white/[0.03] border border-white/20 text-white text-sm outline-none placeholder:text-white/40 placeholder:italic transition-colors focus:border-white/40 focus:bg-white/[0.06]"
          />

          <div className="w-[280px] flex justify-center mt-4">
             <button
               type="submit"
               disabled={saving || !form.currentPassword || !form.newPassword || form.newPassword !== form.confirmPassword}
               className="w-[140px] h-[34px] rounded-full bg-white text-black text-xs font-semibold tracking-wide flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {saving ? "..." : "Change Password"}
             </button>
          </div>
          
          <div className="mt-4">
             <button type="button" onClick={() => router.back()} className="text-white/40 hover:text-white text-xs italic transition-colors flex items-center">
               <ArrowLeft size={12} className="mr-1" /> Back
             </button>
          </div>
        </form>
      </motion.div>
    </AuthLayout3D>
  );
}
