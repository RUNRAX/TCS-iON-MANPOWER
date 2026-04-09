"use client";
/**
 * app/(super)/layout.tsx — Cinematic Master Admin Layout
 *
 * Cold-ice glass sidebar with independent navigation.
 * Verifies super_admin role via /api/auth/me before rendering.
 * Uses a completely separate aesthetic from the regular admin (ice-blue, not warm-orange).
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  LayoutDashboard,
  Users,
  Activity,
  Radio,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

/* ── Master admin nav ─────────────────────────────────────────────────────── */
const superNav = [
  { label: "Command Center", icon: LayoutDashboard, href: "/super/dashboard" },
  { label: "Admin Accounts", icon: Users, href: "/super/admins" },
  { label: "System Activity", icon: Activity, href: "/super/activity" },
  { label: "Broadcast", icon: Radio, href: "/super/broadcast" },
  { label: "Platform Settings", icon: Settings, href: "/super/settings" },
];

/* ── Master palette — cold ice, NOT warm orange ───────────────────────────── */
const MASTER_PALETTE = {
  primary: "#1a6fff",
  secondary: "#0a3fa8",
  accent: "#67e8f9",
  glow: "rgba(26,111,255,0.18)",
  glowStrong: "rgba(26,111,255,0.35)",
};

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{
    email: string;
    role: string;
  } | null>(null);
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

  // ── Style tokens
  const iceBorder = dark
    ? "rgba(100,200,255,0.18)"
    : "rgba(100,180,255,0.40)";
  const iceAccent = dark ? "#a0d4ff" : "#1a5fa8";
  const iceGlow = "rgba(100,180,255,0.12)";

  const panelBg = (opacity: number) =>
    dark
      ? `rgba(3, 2, 16, ${(0.9 * opacity / 100).toFixed(2)})`
      : `rgba(220, 230, 255, ${(0.72 * opacity / 100).toFixed(2)})`;

  const blur = glassFrost
    ? `blur(${glassBlur + 20}px) saturate(240%) brightness(${dark ? 1.07 : 1.03})`
    : "none";

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
          background: dark
            ? "radial-gradient(ellipse at 20% 10%, rgba(20,30,80,0.9) 0%, #030210 60%)"
            : "radial-gradient(ellipse at 20% 10%, rgba(180,200,255,0.6) 0%, #e8eeff 60%)",
        }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            color: iceAccent,
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          ◈ VERIFYING ACCESS...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: dark
          ? "radial-gradient(ellipse at 20% 10%, rgba(20,30,80,0.9) 0%, #030210 60%)"
          : "radial-gradient(ellipse at 20% 10%, rgba(180,200,255,0.6) 0%, #e8eeff 60%)",
      }}
    >
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
          background: panelBg(glassOpacity + 15),
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          borderRight: `1px solid ${iceBorder}`,
          boxShadow: dark
            ? `inset -1px 0 0 ${iceGlow}, 4px 0 40px rgba(0,10,40,0.5)`
            : `inset -1px 0 0 rgba(100,180,255,0.3), 4px 0 20px rgba(0,0,0,0.08)`,
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
              background: dark
                ? "linear-gradient(135deg, rgba(30,60,120,0.8), rgba(10,20,60,0.9))"
                : "linear-gradient(135deg, rgba(20,80,180,0.15), rgba(10,40,120,0.08))",
              border: `1px solid ${iceBorder}`,
              boxShadow: `0 0 20px ${iceGlow}`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: "linear-gradient(135deg, #1a6fff, #0a3fa8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(30,100,255,0.40)",
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
                  textTransform: "uppercase" as const,
                  color: iceAccent,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                Master Admin
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: dark
                    ? "rgba(160,200,255,0.5)"
                    : "rgba(30,80,180,0.5)",
                  letterSpacing: 0.5,
                }}
              >
                super_admin
              </p>
            </div>
          </div>
        </div>

        {/* ── Nav items ── */}
        <nav
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {superNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none" }}
              >
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
                      ? "linear-gradient(135deg, rgba(30,90,220,0.8), rgba(15,50,160,0.7))"
                      : "transparent",
                    border: active
                      ? `1px solid ${iceBorder}`
                      : "1px solid transparent",
                    boxShadow: active
                      ? `0 4px 20px rgba(30,100,255,0.25), inset 0 1px 0 rgba(255,255,255,0.12)`
                      : "none",
                    transition:
                      "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <Icon
                    size={16}
                    color={
                      active
                        ? "#a0d4ff"
                        : dark
                          ? "rgba(160,200,255,0.50)"
                          : "rgba(30,80,180,0.55)"
                    }
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active
                        ? dark
                          ? "#daeeff"
                          : "#1040a0"
                        : dark
                          ? "rgba(180,210,255,0.65)"
                          : "rgba(30,80,180,0.65)",
                      letterSpacing: 0.2,
                    }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}

          {/* ── Separator line ── */}
          <div
            style={{
              height: 1,
              margin: "12px 8px",
              background: dark
                ? "rgba(100,180,255,0.12)"
                : "rgba(30,80,180,0.12)",
            }}
          />

          {/* ── Back to Admin Panel link ── */}
          <Link href="/admin/dashboard" style={{ textDecoration: "none" }}>
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
                background: "transparent",
                border: "1px solid transparent",
                transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <LayoutDashboard
                size={16}
                color="var(--tc-primary)"
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--tc-primary)",
                  letterSpacing: 0.2,
                }}
              >
                Admin Panel
              </span>
            </motion.div>
          </Link>
        </nav>

        {/* ── Footer — user info ── */}
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 13,
            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${iceBorder}`,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: iceAccent,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            {user?.email ?? "Loading..."}
          </p>
          <p
            style={{
              fontSize: 10,
              color: dark
                ? "rgba(160,200,255,0.4)"
                : "rgba(30,80,180,0.4)",
              marginTop: 2,
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
              background: dark
                ? "rgba(239,68,68,0.08)"
                : "rgba(239,68,68,0.06)",
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
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}
