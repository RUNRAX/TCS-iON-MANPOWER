"use client";
/**
 * app/(super)/super/admins/page.tsx — Admin Account Manager
 *
 * "Access Control Terminal" — list admin accounts, create new ones,
 * toggle active status, reset passwords, update center codes.
 * Cold ice-blue palette with cinematic modal and credentials card.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  MapPin,
  Copy,
  X,
  Check,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Building2,
} from "lucide-react";

/* ── Master palette ───────────────────────────────────────────────────────── */
const MASTER_PALETTE = {
  primary: "#1a6fff",
  secondary: "#0a3fa8",
  accent: "#67e8f9",
};

/* ── Animations ───────────────────────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 30 } },
};

export default function SuperAdminsPage() {
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();
  const queryClient = useQueryClient();

  // ── State
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);

  // ── Style tokens
  // Glass frost bindings
  const dimText = dark
    ? "rgba(255,255,255,0.50)"
    : "rgba(0,0,0,0.55)";

  const masterGlass = {
    background: "var(--spatial-glass-bg)",
    backdropFilter: "var(--spatial-glass-blur)",
    WebkitBackdropFilter: "var(--spatial-glass-blur)",
    border: "var(--spatial-glass-border)",
    boxShadow: "var(--spatial-glass-shadow)",
    borderRadius: 24,
  };

  // ── Fetch admins
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["super", "admins"],
    queryFn: () => fetch("/api/super/admins").then(r => r.json()).then(d => d.data),
    staleTime: 30_000,
  });

  const admins: any[] = data?.admins ?? [];
  const filtered = admins.filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.fullName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.centerCode?.toLowerCase().includes(q)
    );
  });

  // ── Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const res = await fetch(`/api/super/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_active" }),
      });
      return res.json();
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["super", "admins"] });
      toast.success(d.data?.active ? "Admin activated" : "Admin deactivated");
      setConfirmDeactivate(null);
    },
    onError: () => toast.error("Failed to toggle admin status"),
  });

  // ── Reset password mutation
  const resetMutation = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const res = await fetch(`/api/super/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", email }),
      });
      return res.json();
    },
    onSuccess: (d) => {
      if (d.data?.resetUrl) {
        navigator.clipboard.writeText(d.data.resetUrl);
        toast.success("Reset link copied to clipboard");
      }
    },
    onError: () => toast.error("Failed to generate reset link"),
  });

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(100,180,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,180,255,0.08) 1px, transparent 1px)`,
        backgroundSize: "40px 40px", animation: "gridPulse 4s ease-in-out infinite",
      }} />

      <motion.div variants={container} initial="hidden" animate="show"
        style={{ position: "relative", zIndex: 1, padding: "32px 28px 48px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <motion.div variants={item} style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase",
            color: dark ? "#e8f4ff" : "#0a2060", fontFamily: "var(--font-jetbrains-mono)",
          }}>ADMIN ACCOUNTS</h1>
          <p style={{ fontSize: 12, color: dimText, marginTop: 4, fontFamily: "var(--font-jetbrains-mono)" }}>
            Access control terminal — manage center administrators
          </p>
        </motion.div>

        {/* Toolbar */}
        <motion.div variants={item} style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{
            flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 10,
            padding: "10px 16px", ...masterGlass, borderRadius: 14,
          }}>
            <Search size={16} color={dimText} />
            <input
              placeholder="Search by name, email, or center code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: 13, color: dark ? "#daeeff" : "#0a2060",
                fontFamily: "var(--font-outfit)",
              }}
            />
          </div>
          {/* Create button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(26,111,255,0.50)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            style={{
              background: `linear-gradient(135deg, ${MASTER_PALETTE.primary}, ${MASTER_PALETTE.secondary})`,
              color: "#fff", border: "none", borderRadius: 14, padding: "10px 20px",
              fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 6px 24px rgba(26,111,255,0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
            }}
          >
            <Plus size={16} /> Create New Admin
          </motion.button>
        </motion.div>

        {/* Admin cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ ...masterGlass, padding: 20, height: 80, animation: "shimmer 1.4s ease infinite",
                background: dark
                  ? "linear-gradient(90deg, rgba(10,30,80,0.4) 25%, rgba(26,111,255,0.12) 50%, rgba(10,30,80,0.4) 75%)"
                  : "linear-gradient(90deg, rgba(200,220,255,0.4) 25%, rgba(100,180,255,0.2) 50%, rgba(200,220,255,0.4) 75%)",
                backgroundSize: "400px 100%",
              }} />
            ))
          ) : filtered.length === 0 ? (
            <motion.div variants={item} style={{ ...masterGlass, padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: dimText }}>No admins found.</p>
            </motion.div>
          ) : (
            filtered.map((admin: any) => (
              <motion.div key={admin.id} variants={item}
                whileHover={{ y: -2, boxShadow: `0 16px 48px rgba(26,111,255,0.15), ${masterGlass.boxShadow}` }}
                style={{ ...masterGlass, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, cursor: "default" }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: admin.role === "super_admin"
                    ? "linear-gradient(135deg, #1a6fff, #0a3fa8)"
                    : `linear-gradient(135deg, ${MASTER_PALETTE.primary}80, ${MASTER_PALETTE.secondary}80)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 12px rgba(26,111,255,0.25)`,
                  fontSize: 16, fontWeight: 800, color: "#fff",
                }}>
                  {admin.fullName?.[0]?.toUpperCase() ?? "A"}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: dark ? "#e8f4ff" : "#0a2060" }}>
                      {admin.fullName ?? "—"}
                    </p>
                    {admin.role === "super_admin" && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase",
                        padding: "2px 8px", borderRadius: 6, color: MASTER_PALETTE.accent,
                        background: dark ? "rgba(26,111,255,0.15)" : "rgba(26,111,255,0.08)",
                        border: `1px solid ${dark ? "rgba(26,111,255,0.25)" : "rgba(26,111,255,0.20)"}`,
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}>SUPER</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: dimText, marginTop: 2 }}>{admin.email}</p>
                </div>

                {/* Center code badge */}
                <div style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: dark ? "rgba(26,111,255,0.10)" : "rgba(26,111,255,0.06)",
                  border: `1px solid ${dark ? "rgba(26,111,255,0.20)" : "rgba(26,111,255,0.18)"}`,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: MASTER_PALETTE.accent,
                    fontFamily: "var(--font-jetbrains-mono)", letterSpacing: 2,
                  }}>{admin.centerCode ?? "—"}</span>
                </div>

                {/* Active status pill */}
                <span style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: admin.isActive
                    ? (dark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)")
                    : (dark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)"),
                  color: admin.isActive ? "#22c55e" : "#ef4444",
                  border: `1px solid ${admin.isActive ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.20)"}`,
                }}>
                  {admin.isActive ? "Active" : "Inactive"}
                </span>

                {/* Last login */}
                <span style={{ fontSize: 11, color: dimText, minWidth: 80, textAlign: "right", fontFamily: "var(--font-jetbrains-mono)" }}>
                  {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "Never"}
                </span>

                {/* Actions */}
                {admin.role !== "super_admin" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {/* Toggle active */}
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (admin.isActive) {
                          setConfirmDeactivate(admin.id);
                        } else {
                          toggleMutation.mutate({ id: admin.id, email: admin.email });
                        }
                      }}
                      title={admin.isActive ? "Deactivate" : "Activate"}
                      style={{
                        background: "transparent", border: "var(--spatial-glass-border)",
                        borderRadius: 8, padding: "6px 8px", cursor: "pointer",
                        color: admin.isActive ? "#ef4444" : "#22c55e",
                      }}
                    >
                      {admin.isActive ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                    </motion.button>
                    {/* Reset password */}
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => resetMutation.mutate({ id: admin.id, email: admin.email })}
                      title="Reset password"
                      style={{
                        background: "transparent", border: "var(--spatial-glass-border)",
                        borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: dimText,
                      }}
                    >
                      <KeyRound size={14} />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* ── Deactivate confirmation inline ── */}
        <AnimatePresence>
          {confirmDeactivate && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, zIndex: 100,
                background: "rgba(0,0,0,0.60)", backdropFilter: "blur(12px)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onClick={() => setConfirmDeactivate(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ ...masterGlass, padding: "28px 32px", maxWidth: 440, width: "90%" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <AlertTriangle size={20} color="#ef4444" />
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>Deactivate Admin?</p>
                </div>
                <p style={{ fontSize: 13, color: dark ? "rgba(200,220,255,0.70)" : "rgba(30,60,140,0.65)", lineHeight: 1.6, marginBottom: 20 }}>
                  This will immediately lock the admin out of the portal. Their employees will remain in the system.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDeactivate(null)}
                    style={{
                      background: "transparent", border: "var(--spatial-glass-border)", borderRadius: 12,
                      padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      color: dark ? "#daeeff" : "#0a2060",
                    }}>Cancel</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const admin = admins.find((a: any) => a.id === confirmDeactivate);
                      if (admin) toggleMutation.mutate({ id: admin.id, email: admin.email });
                    }}
                    style={{
                      background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.30)",
                      borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", color: "#ef4444",
                    }}>Deactivate</motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Create Admin Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateAdminModal
            dark={dark}
            masterGlass={masterGlass}
            dimText={dimText}
            glassOpacity={glassOpacity}
            onClose={() => { setShowCreate(false); refetch(); }}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes gridPulse { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.12; } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CREATE ADMIN MODAL — Full-screen frosted overlay
   ══════════════════════════════════════════════════════════════════════════════ */
function CreateAdminModal({
  dark, masterGlass, dimText, glassOpacity, onClose,
}: {
  dark: boolean;
  masterGlass: Record<string, any>;
  dimText: string;
  glassOpacity: number;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", centerCode: "" });
  const [centerAvailable, setCenterAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ adminId: string; centerCode: string; tempPassword: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Live center code uniqueness check
  const checkCenter = useCallback((code: string) => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (code.length !== 3 || !/^[A-Z]{3}$/.test(code)) {
      setCenterAvailable(null);
      return;
    }
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/super/admins?checkCenter=${code}`);
        const json = await res.json();
        setCenterAvailable(json.data?.available ?? false);
      } catch {
        setCenterAvailable(null);
      }
    }, 500);
  }, []);

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.phone || !form.centerCode) {
      toast.error("All fields are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/super/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message ?? "Failed to create admin");
        return;
      }
      setResult(json.data);
      toast.success("Admin account created!");
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = () => {
    if (result?.tempPassword) {
      navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.70)", backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ ...masterGlass, padding: "32px 36px", maxWidth: 520, width: "92%" }}
      >
        {/* Close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
            color: dark ? "#e8f4ff" : "#0a2060", fontFamily: "var(--font-jetbrains-mono)",
          }}>
            {result ? "ACCOUNT CREATED" : "CREATE ADMIN"}
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: dimText }}>
            <X size={20} />
          </motion.button>
        </div>

        {result ? (
          /* ── Credentials card ── */
          <div>
            <p style={{ fontSize: 13, color: dark ? "rgba(200,220,255,0.70)" : "rgba(30,60,140,0.65)", marginBottom: 20 }}>
              {result.message}
            </p>
            <div style={{
              padding: "20px", borderRadius: 16,
              background: dark ? "rgba(26,111,255,0.08)" : "rgba(26,111,255,0.04)",
              border: `1px solid ${dark ? "rgba(26,111,255,0.20)" : "rgba(26,111,255,0.15)"}`,
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: dimText, fontFamily: "var(--font-jetbrains-mono)" }}>CENTER CODE</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: MASTER_PALETTE.accent, fontFamily: "var(--font-jetbrains-mono)", letterSpacing: 3 }}>{result.centerCode}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: dimText, fontFamily: "var(--font-jetbrains-mono)" }}>TEMPORARY PASSWORD</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", fontFamily: "var(--font-jetbrains-mono)", letterSpacing: 1 }}>{result.tempPassword}</p>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={copyPassword}
                    style={{ background: "transparent", border: "var(--spatial-glass-border)", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: copied ? "#22c55e" : dimText }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </motion.button>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: dimText, marginTop: 14, fontStyle: "italic" }}>
              A welcome email with credentials has been sent.
            </p>
          </div>
        ) : (
          /* ── Form ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Full Name */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: dimText, fontFamily: "var(--font-jetbrains-mono)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <User size={12} /> Full Name
              </label>
              <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="e.g. Rakshit Awati"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 12,
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: "var(--spatial-glass-border)", outline: "none", fontSize: 13,
                  color: dark ? "#daeeff" : "#0a2060", fontFamily: "var(--font-outfit)",
                }} />
            </div>
            {/* Email */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: dimText, fontFamily: "var(--font-jetbrains-mono)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Mail size={12} /> Email
              </label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email"
                placeholder="admin@example.com"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 12,
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: "var(--spatial-glass-border)", outline: "none", fontSize: 13,
                  color: dark ? "#daeeff" : "#0a2060", fontFamily: "var(--font-outfit)",
                }} />
            </div>
            {/* Phone */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: dimText, fontFamily: "var(--font-jetbrains-mono)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Phone size={12} /> Phone
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: dimText, fontFamily: "var(--font-jetbrains-mono)" }}>+91</span>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  placeholder="9876543210"
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 12,
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: "var(--spatial-glass-border)", outline: "none", fontSize: 13,
                    color: dark ? "#daeeff" : "#0a2060", fontFamily: "var(--font-jetbrains-mono)",
                  }} />
              </div>
            </div>
            {/* Center Code */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: dimText, fontFamily: "var(--font-jetbrains-mono)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Building2 size={12} /> Center Code (3 letters)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input value={form.centerCode}
                  onChange={e => {
                    const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
                    setForm(p => ({ ...p, centerCode: v }));
                    checkCenter(v);
                  }}
                  placeholder="BLR"
                  maxLength={3}
                  style={{
                    width: 100, padding: "10px 14px", borderRadius: 12, textAlign: "center",
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: `1px solid ${
                      centerAvailable === true ? "rgba(34,197,94,0.40)"
                        : centerAvailable === false ? "rgba(239,68,68,0.40)"
                        : "var(--tc-primary)"
                    }`,
                    outline: "none", fontSize: 18, fontWeight: 800, letterSpacing: 4,
                    color: dark ? "#daeeff" : "#0a2060", fontFamily: "var(--font-jetbrains-mono)",
                  }} />
                {centerAvailable === true && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>✓ Available</span>}
                {centerAvailable === false && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>✗ Taken</span>}
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(26,111,255,0.50)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting || centerAvailable === false}
              style={{
                background: submitting || centerAvailable === false
                  ? (dark ? "rgba(100,200,255,0.10)" : "rgba(100,180,255,0.08)")
                  : `linear-gradient(135deg, ${MASTER_PALETTE.primary}, ${MASTER_PALETTE.secondary})`,
                color: submitting || centerAvailable === false ? dimText : "#fff",
                border: "none", borderRadius: 14, padding: "14px 24px",
                fontSize: 14, fontWeight: 700, cursor: submitting ? "wait" : "pointer",
                boxShadow: submitting ? "none" : "0 6px 24px rgba(26,111,255,0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
                marginTop: 8, transition: "all 0.2s ease",
              }}
            >
              {submitting ? "Creating..." : "Create Admin Account"}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
