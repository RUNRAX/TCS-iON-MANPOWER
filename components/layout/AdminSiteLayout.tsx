"use client";
/**
 * components/layout/SiteLayout.tsx  — iOS 26.4 "Liquid Glass" Dashboard Shell
 *
 * Sidebar, header, canvas background, and nav items.
 * Used by: app/(dashboard)/layout.tsx
 */

import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ThemePanel from "@/components/ThemePanel";
import NotificationPanel from "@/components/NotificationPanel";
import { LiveClock } from "@/components/ui/LiveClock";

import {
  LayoutDashboard, Users, CalendarDays, ClipboardList,
  LogOut, Menu, X, Building2,
  FileSpreadsheet, UserCheck, MessageSquare,
  Bell, Settings, Grid3X3,
  Search, BarChart3, ClipboardCheck,
  ShieldCheck, Activity, Radio,
} from "lucide-react";

/* ── Nav config ──────────────────────────────────────────────────────────── */
const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "Employees", icon: Users, href: "/admin/employees" },
  { label: "Schedule", icon: CalendarDays, href: "/admin/shifts" },
  { label: "Attendance", icon: ClipboardCheck, href: "/admin/payments" },
  { label: "Analytics", icon: BarChart3, href: "/admin/excel" },
  { label: "Notifications", icon: Bell, href: "/admin/broadcast" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

const employeeNav = [
  { label: "My Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
  { label: "Available Shifts", icon: CalendarDays, href: "/employee/shifts" },
  { label: "My Bookings", icon: ClipboardList, href: "/employee/history" },
  { label: "My Profile", icon: UserCheck, href: "/employee/profile" },
  { label: "Payments", icon: FileSpreadsheet, href: "/employee/payments" },
  { label: "Settings", icon: Settings, href: "/employee/settings" },
];

const superAdminNav = [
  { label: "Command Center",  icon: ShieldCheck,      href: "/super/dashboard" },
  { label: "Admin Accounts",  icon: Users,             href: "/super/admins" },
  { label: "System Activity", icon: Activity,          href: "/super/activity" },
  { label: "Sys Broadcast",   icon: Radio,             href: "/super/broadcast" },
  { label: "Platform",        icon: Settings,          href: "/super/settings" },
];

/* ── Helper: get greeting ────────────────────────────────────────────────── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
function getDateString(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

/* ── Dynamic background configs ──────────────────────────────────────────── */
const BG_CONFIGS = [
  // Config 0 — Deep purple orbs
  [
    { top: "-10%", right: "-5%", w: "45vw", h: "45vw", color: "var(--tc-primary)", opacity: 0.12, blur: 80, anim: "orbFloat2" },
    { bottom: "-5%", left: "5%", w: "35vw", h: "35vw", color: "var(--tc-secondary)", opacity: 0.10, blur: 64, anim: "orbFloat3" },
    { top: "30%", left: "40%", w: "28vw", h: "28vw", color: "var(--tc-accent)", opacity: 0.08, blur: 100, anim: "orbFloat4" },
  ],
  // Config 1 — Wide spread
  [
    { top: "5%", left: "10%", w: "50vw", h: "50vw", color: "var(--tc-secondary)", opacity: 0.10, blur: 90, anim: "orbFloat1" },
    { bottom: "10%", right: "-8%", w: "40vw", h: "40vw", color: "var(--tc-accent)", opacity: 0.12, blur: 70, anim: "orbFloat4" },
    { top: "50%", left: "55%", w: "25vw", h: "25vw", color: "var(--tc-primary)", opacity: 0.08, blur: 110, anim: "orbFloat2" },
  ],
  // Config 2 — Center glow
  [
    { top: "15%", left: "25%", w: "55vw", h: "55vw", color: "var(--tc-primary)", opacity: 0.09, blur: 120, anim: "orbFloat3" },
    { bottom: "-12%", right: "15%", w: "38vw", h: "38vw", color: "var(--tc-secondary)", opacity: 0.11, blur: 75, anim: "orbFloat1" },
    { top: "-5%", right: "30%", w: "30vw", h: "30vw", color: "var(--tc-accent)", opacity: 0.07, blur: 95, anim: "orbFloat2" },
  ],
  // Config 3 — Diagonal flow
  [
    { top: "-8%", left: "-5%", w: "42vw", h: "42vw", color: "var(--tc-accent)", opacity: 0.10, blur: 85, anim: "orbFloat4" },
    { top: "40%", right: "5%", w: "48vw", h: "48vw", color: "var(--tc-primary)", opacity: 0.08, blur: 100, anim: "orbFloat1" },
    { bottom: "5%", left: "30%", w: "32vw", h: "32vw", color: "var(--tc-secondary)", opacity: 0.11, blur: 70, anim: "orbFloat3" },
  ],
];

/* ── NavItem ─────────────────────────────────────────────────────────────── */
interface NavItemProps {
  item: { label: string; icon: React.ElementType; href: string };
  active: boolean;
  textMuted: string;
}

const NavItem = memo(function NavItem({ item, active, textMuted }: NavItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial="idle"
      animate={hovered ? "hover" : "idle"}
      whileTap="tap"
      variants={{
        idle: { scale: 1, x: 0, transition: { duration: 0.6, ease: "easeInOut" } },
        hover: { scale: 1.012, x: 2, transition: { type: "spring", stiffness: 100, damping: 20 } },
        tap: { scale: 0.955, x: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        borderRadius: 14,
        cursor: "pointer",
        transformStyle: "preserve-3d",
        willChange: "transform",
        background: active
          ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))"
          : hovered
            ? "color-mix(in srgb, var(--tc-primary) 9%, transparent)"
            : "transparent",
        boxShadow: active
          ? [
            "inset 0 1.5px 0 rgba(255,255,255,0.26)",
            "inset 0 -1px 0 rgba(0,0,0,0.16)",
            "0 6px 28px color-mix(in srgb, var(--tc-primary) 40%, transparent)",
          ].join(", ")
          : hovered
            ? "0 4px 20px color-mix(in srgb, var(--tc-primary) 18%, transparent), 0 0 0 1px color-mix(in srgb, var(--tc-primary) 15%, transparent)"
            : "none",
        transition: "background 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Hover radial glow */}
      {!active && (
        <motion.div
          variants={{ idle: { opacity: 0 }, hover: { opacity: 1 } }}
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 14,
            background: "radial-gradient(ellipse at 30% 50%, color-mix(in srgb, var(--tc-primary) 16%, transparent) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Active dot indicator */}
      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--tc-primary)",
            boxShadow: "0 0 8px color-mix(in srgb, var(--tc-primary) 60%, transparent)",
          }}
        />
      )}

      {/* Icon */}
      <motion.div
        variants={{
          idle: { scale: 1, rotate: 0 },
          hover: { scale: 1.18, rotate: -5 },
          tap: { scale: 0.90, rotate: 0 },
        }}
        style={{ flexShrink: 0, willChange: "transform" }}
      >
        <item.icon
          className="w-[18px] h-[18px]"
          style={{
            color: active ? "#fff" : "var(--tc-primary)",
            filter: hovered && !active ? "drop-shadow(0 0 8px var(--tc-primary))" : "none",
            transition: "filter 0.25s ease",
          }}
        />
      </motion.div>

      {/* Label */}
      <span style={{
        fontSize: 14,
        fontWeight: active || hovered ? 600 : 500,
        color: active ? "#fff" : hovered ? "var(--tc-primary)" : textMuted,
        transition: "color 0.22s ease",
        flex: 1,
        letterSpacing: hovered ? "0.01em" : "0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif",
      }}>
        {item.label}
      </span>

      {active && (
        <motion.div
          layoutId="nav-active-bar"
          style={{
            position: "absolute",
            right: -1,
            top: "18%",
            bottom: "18%",
            width: 3,
            borderRadius: 99,
            background: "#fff",
            opacity: 0.55,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
    </motion.div>
  );
});


/* ── Liquid Background Component (Internal) ──────────────────────────────── */
const LiquidBackground = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, overflow: "hidden" }}>
      {/* Top-Left Droplet */}
      <div className="glowing-orb" style={{
        top: "-15%", left: "-5%",
        width: isMobile ? "40vmax" : "55vmax",
        height: isMobile ? "40vmax" : "55vmax",
        boxShadow: `inset -20px -30px ${isMobile ? 60 : 120}px var(--orb-edge-1), inset -2px -4px 12px var(--orb-edge-2), 0 40px ${isMobile ? 60 : 120}px rgba(0,0,0,0.7)`,
        animation: isMobile ? "floatOrb1 50s ease-in-out infinite" : "floatOrb1 32s ease-in-out infinite",
      }} />
      {/* Bottom-Right Droplet */}
      <div className="glowing-orb" style={{
        bottom: "-15%", right: "-5%",
        width: isMobile ? "45vmax" : "60vmax",
        height: isMobile ? "45vmax" : "60vmax",
        boxShadow: `inset 20px 30px ${isMobile ? 60 : 120}px var(--orb-edge-2), inset 2px 4px 12px var(--orb-edge-3), 0 -40px ${isMobile ? 60 : 120}px rgba(0,0,0,0.7)`,
        animation: isMobile ? "floatOrb2 60s ease-in-out infinite" : "floatOrb2 40s ease-in-out infinite",
      }} />
      {/* Mid-Left Overlapping Droplet */}
      <div className="glowing-orb" style={{
        top: "20%", left: "-15%",
        width: isMobile ? "35vmax" : "45vmax",
        height: isMobile ? "35vmax" : "45vmax",
        boxShadow: `inset -15px 25px ${isMobile ? 50 : 100}px var(--orb-edge-3), inset -2px 3px 10px var(--orb-edge-1), 0 20px ${isMobile ? 50 : 100}px rgba(0,0,0,0.6)`,
        animation: isMobile ? "floatOrb3 55s ease-in-out infinite" : "floatOrb3 35s ease-in-out infinite",
      }} />
    </div>
  );
};

/* ── Main SiteLayout ─────────────────────────────────────────────────────── */
interface SiteLayoutProps {
  children: React.ReactNode;
  role: "admin" | "employee" | "super_admin";
  userId: string;
  userEmail: string;
  userFullName?: string;
}

export default function AdminSiteLayout({
  children, role, userId, userEmail, userFullName,
}: SiteLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Track scroll position on main content area
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    // Using 45px so the *visual* text elements (bypassing padding & line-height gaps) hit the header
    const onScroll = () => setScrolled(el.scrollTop > 45);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);



  /* Design tokens 
     Read dynamic opacity directly from the ThemeContext integers 
  */
  const alphaVal = glassFrost ? (glassOpacity / 100).toFixed(2) : (dark ? "0.98" : "1");
  // Always transparent so the <body> background + orbs are visible in both modes
  const bgMain = "transparent";
  const sidebarBg = dark ? `rgba(30,30,35,0.4)` : `rgba(252,251,255,${alphaVal})`;
  // Header: transparent background — blur alone provides the frosted effect
  const headerBg = "transparent";
  const borderCol = dark
    ? "rgba(255,255,255,0.10)"
    : "color-mix(in srgb, var(--tc-primary) 12%, rgba(255,255,255,0.85))";
  const edgeShadow = dark
    ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 24px 48px rgba(0,0,0,0.4)"
    : "inset 0 1.5px 0 rgba(255,255,255,0.96), inset 0 -1px 0 rgba(0,0,0,0.03), inset 1px 0 0 rgba(255,255,255,0.80)";
  const textMain = dark ? "rgba(255,255,255,0.95)" : "#0f0a2e";
  const textMuted = dark ? "rgba(255,255,255,0.6)" : "rgba(30,20,80,0.44)";

  const navItems = role === "super_admin"
    ? superAdminNav
    : role === "admin"
      ? adminNav
      : employeeNav;
  const displayName = userFullName ?? "Admin";
  const isSuperAdmin = role === "super_admin";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/admin/login");
  };

  const actualBlur = glassFrost ? glassBlur : 0;
  // Sidebar: NO blur — background stays sharp
  const BLUR_SIDEBAR = "none";
  // Header blur: ALWAYS enhanced frosted glass — stronger when scrolled
  // Math.max(0, ...) ensures blur never goes negative during Framer spring bounces
  const headerBlurPx = Math.max(0, scrolled ? Math.max(actualBlur, 32) : Math.max(actualBlur, 18));
  const BLUR_HEADER = `blur(${headerBlurPx}px)`;

  return (
    <div
      className="flex h-screen overflow-hidden relative p-4 gap-3"
      style={{
        background: bgMain,
        color: textMain,
        transition: "background 0.5s cubic-bezier(0.22,1,0.36,1), color 0.4s ease",
      }}
      suppressHydrationWarning
    >
      {/* ── Background (Client-only) ── */}
      {mounted && <LiquidBackground />}

      {/* ── Sidebar ── */}
      <aside
        className={`admin-panel fixed inset-y-4 left-4 z-40 w-[235px] rounded-2xl flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-[110%] md:translate-x-0"}
          md:relative md:inset-auto md:h-full md:translate-x-0 md:flex-shrink-0`}
        style={{
          borderRight: `1px solid ${borderCol}`,
          boxShadow: edgeShadow,
          willChange: "transform, opacity",
          overflow: "hidden",
          transition: "background 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.4s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* ── Sidebar Abstract Geometric Pattern ── */}
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, overflow: "hidden", borderRadius: "inherit" }}>
          {/* Abstract diagonal mesh — removed */}
          {/* Corner accent — top-left radial */}
          <div style={{
            position: "absolute", top: 0, left: 0, width: "60%", height: "40%",
            background: `radial-gradient(ellipse at 0% 0%, color-mix(in srgb, var(--tc-primary) 12%, transparent) 0%, transparent 70%)`,
          }} />
          {/* Corner accent — bottom-right radial */}
          <div style={{
            position: "absolute", bottom: 0, right: 0, width: "50%", height: "35%",
            background: `radial-gradient(ellipse at 100% 100%, color-mix(in srgb, var(--tc-secondary) 10%, transparent) 0%, transparent 70%)`,
          }} />
        </div>
        {/* Inner top sheen */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "28%",
          background: dark
            ? "linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 100%)"
            : "linear-gradient(to bottom, rgba(255,255,255,0.80) 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Logo / Master Admin badge */}
        <div className="px-4 py-4 relative z-10" style={{ borderBottom: `1px solid ${borderCol}` }}>
          {isSuperAdmin ? (
            /* ── MASTER CONTROL badge — cold-ice style for super_admin ── */
            <div style={{
              padding: "10px 12px", borderRadius: 14, marginBottom: 0,
              background: dark
                ? `linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 35%, rgba(0,0,0,0.9)), color-mix(in srgb, var(--tc-secondary) 20%, rgba(0,0,0,0.95)))`
                : `linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 15%, transparent), color-mix(in srgb, var(--tc-secondary) 8%, transparent))`,
              border: `1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)`,
              boxShadow: `0 0 20px color-mix(in srgb, var(--tc-primary) 15%, transparent)`,
            }}>
              <p style={{
                fontSize: 9, fontWeight: 800, letterSpacing: 3,
                textTransform: "uppercase", color: "var(--tc-accent)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}>◈ MASTER CONTROL</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--tc-primary)", marginTop: 2 }}>
                super_admin
              </p>
            </div>
          ) : (
            /* ── Normal TCS iON logo for admin/employee ── */
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 16px color-mix(in srgb, var(--tc-primary) 30%, transparent)",
                    "0 0 32px color-mix(in srgb, var(--tc-primary) 20%, transparent)",
                    "0 0 16px color-mix(in srgb, var(--tc-primary) 30%, transparent)",
                  ],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.15)",
                }}
              >
                <Building2 className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h1 className="font-black text-[14px] tracking-tight" style={{ color: textMain }}>TCS iON</h1>
                <p className="text-[9px] tracking-widest font-mono" style={{ color: "var(--tc-primary)", opacity: 0.85 }}>Manpower Portal</p>
              </div>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="px-3 py-3 relative z-10">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{
              background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textMuted }} />
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-[12px] bg-transparent border-none outline-none w-full"
              style={{ color: textMain, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif" }}
            />
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-1 relative z-10">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase"
            style={{
              color: "var(--tc-primary)",
              letterSpacing: "0.12em",
            }}
          >
            {role === "super_admin" ? "MASTER ADMIN" : role === "admin" ? "ADMINISTRATOR" : "EMPLOYEE"}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto relative z-10" style={{ scrollbarWidth: "none" }}>
          {navItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())).map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <NavItem item={item} active={active} textMuted={textMuted} />
              </Link>
            );
          })}
        </nav>

        {/* User footer — island pill */}
        <div className="px-3 py-3 relative z-10">
          <div
            className="rounded-2xl p-2.5"
            style={{
              background: dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)",
              border: `1px solid ${dark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.12)"}`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 0 14px color-mix(in srgb, var(--tc-primary) 28%, transparent)",
                }}
              >
                {(userFullName ?? userEmail)?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold truncate" style={{ color: textMain }}>{userFullName ?? "Admin User"}</p>
                <p className="text-[10px] truncate" style={{ color: textMuted }}>{userEmail}</p>
              </div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                style={{ color: textMuted, cursor: "pointer" }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

          {/* Live Clock */}
          <LiveClock />
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 md:hidden"
            style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.40)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ minWidth: 0 }} suppressHydrationWarning>
        {/* Single scroll container — header is sticky inside so content scrolls behind it */}
        <main ref={mainRef} className="flex-1 overflow-y-auto relative" style={{ scrollBehavior: "smooth" }} suppressHydrationWarning>
          {/* Header — Floating frosted glass pill */}
          <div className="z-50 px-5 md:px-8 lg:px-10" style={{
            position: "sticky", top: 0, zIndex: 50,
          }}>
            <header className="h-[60px] flex items-center justify-between px-5 md:px-6 relative rounded-[20px]" style={{ overflow: "visible" }}>
              {/* ── Background Layer — ALWAYS enhanced frosted glass ── */}
              <motion.div
                initial={{ opacity: 0.85 }}
                animate={{ opacity: scrolled ? 1 : 0.85 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
                  overflow: "hidden",
                  background: dark 
                    ? `rgba(18, 14, 25, ${scrolled ? 0.45 : 0.25})` 
                    : `rgba(255, 255, 255, ${scrolled ? 0.40 : 0.20})`,
                  border: `1px solid ${dark 
                    ? `rgba(255,255,255,${scrolled ? 0.12 : 0.08})` 
                    : `rgba(255,255,255,${scrolled ? 0.85 : 0.65})`}`,
                  borderRadius: 20,
                  backdropFilter: `blur(${headerBlurPx}px) saturate(${scrolled ? 260 : 220}%)`,
                  WebkitBackdropFilter: `blur(${headerBlurPx}px) saturate(${scrolled ? 260 : 220}%)`,
                  boxShadow: dark
                    ? `inset 0 1.5px 2px rgba(255,255,255,${scrolled ? 0.18 : 0.10}), inset 0 -1px 1px rgba(255,255,255,0.03), inset 0 0 32px color-mix(in srgb, var(--tc-primary) ${scrolled ? 15 : 8}%, transparent), 0 8px 32px rgba(0,0,0,${scrolled ? 0.3 : 0.15})`
                    : `inset 0 1.5px 2px rgba(255,255,255,${scrolled ? 0.95 : 0.80}), inset 0 -1px 1px rgba(0,0,0,0.05), inset 0 0 32px color-mix(in srgb, var(--tc-primary) ${scrolled ? 12 : 6}%, transparent), 0 4px 16px rgba(0,0,0,${scrolled ? 0.08 : 0.04})`
                }}
              />

              {/* Mobile toggle */}
              <motion.button
                className="md:hidden p-2 rounded-xl relative z-10"
                style={{ color: textMuted }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                onClick={() => setSidebarOpen(s => !s)}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {sidebarOpen
                    ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}><X className="w-5 h-5" /></motion.span>
                    : <motion.span key="mnu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}><Menu className="w-5 h-5" /></motion.span>
                  }
                </AnimatePresence>
              </motion.button>

              {/* Greeting — Good Morning, Admin + Date */}
              <div className="hidden md:block relative z-10" suppressHydrationWarning>
                {mounted ? (
                  <>
                    <h2 className="text-[15px] font-bold" style={{ color: textMain, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif" }}>
                      {getGreeting()}, {displayName}
                    </h2>
                    <p className="text-[11px]" style={{ color: textMuted }}>
                      {getDateString()}
                    </p>
                  </>
                ) : (
                  <div className="h-10 w-32" /> // Placeholder to match layout
                )}
              </div>

              {/* Actions — Only notification bell + ThemePanel + user */}
              <div className="flex items-center gap-2 ml-auto relative z-10">
                {/* Notification Panel (functional) */}
                <NotificationPanel role={role} userId={userId} />

                {/* Theme panel */}
                <ThemePanel size="sm" />

                {/* User avatar in header */}
                <div className="flex items-center gap-2.5 ml-1">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 0 10px color-mix(in srgb, var(--tc-primary) 25%, transparent)",
                    }}
                  >
                    {(userFullName ?? userEmail)?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold" style={{ color: textMain }}>{displayName}</p>
                    <p className="text-[10px]" style={{ color: textMuted }}>{role === "super_admin" ? "Master Admin" : role === "admin" ? "Admin" : "Employee"}</p>
                  </div>
                </div>
              </div>
            </header>
          </div>

          {/* Page content — always render same DOM structure to avoid hydration mismatch */}
          <div className="px-3 md:px-6 lg:px-8 max-w-[1600px] mx-auto" style={{ minHeight: "100%" }} suppressHydrationWarning>
            {mounted ? (
              <div
                key={pathname}
                style={{ minHeight: "100%" }}
              >
                <ErrorBoundary key={pathname}>
                  {children}
                </ErrorBoundary>
              </div>
            ) : (
              <div style={{ minHeight: "100%", opacity: 0 }}>
                {children}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );

}