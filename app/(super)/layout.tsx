"use client";
/**
 * app/(super)/layout.tsx — Cinematic Master Admin Layout
 *
 * Fully dynamic Glass Frost Theme with Orbital Rings Background.
 * Verifies super_admin role via /api/auth/me before rendering.
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import OrbitalRingsBackground from "@/components/layout/OrbitalRingsBackground";
import {
  LayoutDashboard,
  Users,
  Activity,
  Radio,
  Settings,
  LogOut,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

/* ── Master admin nav ─────────────────────────────────────────────────────── */
const superNav = [
  { label: "Command Center", icon: LayoutDashboard, href: "/super/dashboard" },
  { label: "Admin Accounts", icon: Users, href: "/super/admins" },
  { label: "System Activity", icon: Activity, href: "/super/activity" },
  { label: "Broadcast", icon: Radio, href: "/super/broadcast" },
  { label: "Reports", icon: BarChart3, href: "/super/reports" },
  { label: "Platform Settings", icon: Settings, href: "/super/settings" },
];

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const { dark, theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; role: string; } | null>(null);
  const [verified, setVerified] = useState(false);

  // ── Verify super_admin role on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.role !== "super_admin") {
          router.replace("/admin/dashboard");
        } else {
          setUser(d.data);
          setVerified(true);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Don't render until role is verified
  if (!verified) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: dark ? "#030210" : "#e8eeff",
        }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "var(--tc-primary)",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          ◈ VERIFYING ACCESS...
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* ── Orbital Rings Background ── */}
      <OrbitalRingsBackground />

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 240,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          background: "var(--spatial-glass-bg)",
          backdropFilter: "var(--spatial-glass-blur)",
          WebkitBackdropFilter: "var(--spatial-glass-blur)",
          borderRight: "var(--spatial-glass-border)",
          boxShadow: "var(--spatial-glass-shadow)",
          zIndex: 10,
        }}
      >
        {/* ── Master badge ── */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 16,
              background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)`,
              boxShadow: `0 0 20px color-mix(in srgb, var(--tc-primary) 15%, transparent)`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 16px color-mix(in srgb, var(--tc-primary) 40%, transparent)`,
              }}
            >
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "var(--tc-primary)",
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                Master Admin
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                  letterSpacing: 0.5,
                }}
              >
                super_admin
              </p>
            </div>
          </div>
        </div>

        {/* ── Nav items ── */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {superNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ x: 3, scale: 1.012 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 13,
                    cursor: "pointer",
                    background: active
                      ? `linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 80%, transparent), color-mix(in srgb, var(--tc-secondary) 70%, transparent))`
                      : "transparent",
                    border: active ? `1px solid color-mix(in srgb, var(--tc-primary) 40%, transparent)` : "1px solid transparent",
                    boxShadow: active
                      ? `0 4px 20px color-mix(in srgb, var(--tc-primary) 25%, transparent), inset 0 1px 0 rgba(255,255,255,0.12)`
                      : "none",
                    transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <Icon
                    size={16}
                    color={active ? "#fff" : (dark ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.55)")}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active ? "#fff" : (dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)"),
                      letterSpacing: 0.2,
                    }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* ── Footer — user info ── */}
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 13,
            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border: `1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)`,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--tc-primary)",
              fontWeight: 700,
              letterSpacing: 1,
              wordBreak: "break-all",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            {user?.email ?? "Loading..."}
          </p>
          <p
            style={{
              fontSize: 10,
              color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              marginTop: 4,
            }}
          >
            All systems access
          </p>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${dark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.30)"}`,
              background: dark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
              color: "#f87171",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LogOut size={12} />
            Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, position: "relative", zIndex: 10, overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}
