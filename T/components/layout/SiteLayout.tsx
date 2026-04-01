"use client";
/**
 * components/layout/SiteLayout.tsx  — iOS 26.4 "Liquid Glass" Dashboard Shell
 *
 * Sidebar, header, canvas background, and nav items.
 * Used by: app/(dashboard)/layout.tsx
 */

import React, { useState, useEffect, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import dynamic from "next/dynamic";

const SceneBackground   = dynamic(() => import("./SceneBackground"),               { ssr: false });
const ThemePanel        = dynamic(() => import("@/components/ThemePanel"),          { ssr: false });
const NotificationPanel = dynamic(() => import("@/components/NotificationPanel"),   { ssr: false });

import {
  LayoutDashboard, Users, CalendarDays, ClipboardList,
  LogOut, Menu, X, ChevronRight, Building2,
  FileSpreadsheet, UserCheck, MessageSquare,
} from "lucide-react";

/* ── Nav config ──────────────────────────────────────────────────────────── */
const adminNav = [
  { label: "Dashboard",  icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "Employees",  icon: Users,           href: "/admin/employees" },
  { label: "Shifts",     icon: CalendarDays,    href: "/admin/shifts"    },
  { label: "Bookings",   icon: ClipboardList,   href: "/admin/payments"  },
  { label: "Reports",    icon: FileSpreadsheet, href: "/admin/excel"     },
  { label: "Broadcast",  icon: MessageSquare,   href: "/admin/broadcast" },
];

const employeeNav = [
  { label: "My Dashboard",     icon: LayoutDashboard, href: "/employee/dashboard" },
  { label: "Available Shifts", icon: CalendarDays,    href: "/employee/shifts"    },
  { label: "My Bookings",      icon: ClipboardList,   href: "/employee/history"   },
  { label: "My Profile",       icon: UserCheck,       href: "/employee/profile"   },
  { label: "Payments",         icon: FileSpreadsheet, href: "/employee/payments"  },
];

/* ── NavItem ─────────────────────────────────────────────────────────────── */
interface NavItemProps {
  item:      { label: string; icon: React.ElementType; href: string };
  active:    boolean;
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
        idle:  { scale: 1,     x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
        hover: { scale: 1.012, x: 2, transition: { type: "spring", stiffness: 420, damping: 30 } },
        tap:   { scale: 0.955, x: 1, transition: { type: "spring", stiffness: 500, damping: 22 } },
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position:    "relative",
        display:     "flex",
        alignItems:  "center",
        gap:         10,
        padding:     "10px 12px",
        borderRadius: 14,
        cursor:      "pointer",
        transformStyle: "preserve-3d",
        willChange:  "transform",
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
            position:      "absolute",
            inset:         -1,
            borderRadius:  14,
            background:    "radial-gradient(ellipse at 30% 50%, color-mix(in srgb, var(--tc-primary) 16%, transparent) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Icon */}
      <motion.div
        variants={{
          idle:  { scale: 1,    rotate: 0  },
          hover: { scale: 1.18, rotate: -5 },
          tap:   { scale: 0.90, rotate: 0  },
        }}
        style={{ flexShrink: 0, willChange: "transform" }}
      >
        <item.icon
          className="w-4 h-4"
          style={{
            color:  active ? "#fff" : "var(--tc-primary)",
            filter: hovered && !active ? "drop-shadow(0 0 8px var(--tc-primary))" : "none",
            transition: "filter 0.25s ease",
          }}
        />
      </motion.div>

      {/* Label */}
      <span style={{
        fontSize:   13.5,
        fontWeight: active || hovered ? 600 : 500,
        color:      active ? "#fff" : hovered ? "var(--tc-primary)" : textMuted,
        transition: "color 0.22s ease",
        flex:       1,
        letterSpacing: hovered ? "0.01em" : "0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', sans-serif",
      }}>
        {item.label}
      </span>

      {active && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 0.80, x: 0 }}
          transition={{ duration: 0.20 }}
        >
          <ChevronRight className="w-3 h-3" style={{ color: "#fff" }} />
        </motion.div>
      )}

      {active && (
        <motion.div
          layoutId="nav-active-bar"
          style={{
            position:   "absolute",
            right:      -1,
            top:        "18%",
            bottom:     "18%",
            width:      3,
            borderRadius: 99,
            background: "#fff",
            opacity:    0.55,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
    </motion.div>
  );
});

/* ── Main SiteLayout ─────────────────────────────────────────────────────── */
interface SiteLayoutProps {
  children:      React.ReactNode;
  role:          "admin" | "employee";
  userId:        string;
  userEmail:     string;
  userFullName?: string;
}

export default function SiteLayout({
  children, role, userId, userEmail, userFullName,
}: SiteLayoutProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { dark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* Design tokens */
  const bgMain    = dark ? "#06060e" : "#f0f0fa";
  const sidebarBg = dark ? "rgba(7,5,18,0.90)"  : "rgba(252,251,255,0.88)";
  const headerBg  = dark ? "rgba(7,5,18,0.76)"  : "rgba(252,251,255,0.76)";
  const borderCol = dark
    ? "color-mix(in srgb, var(--tc-primary) 14%, rgba(255,255,255,0.07))"
    : "color-mix(in srgb, var(--tc-primary) 12%, rgba(255,255,255,0.85))";
  const edgeShadow = dark
    ? "inset 0 1.5px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.15), inset 1px 0 0 rgba(255,255,255,0.07)"
    : "inset 0 1.5px 0 rgba(255,255,255,0.96), inset 0 -1px 0 rgba(0,0,0,0.03), inset 1px 0 0 rgba(255,255,255,0.80)";
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.50)" : "rgba(30,20,80,0.44)";

  const navItems = role === "admin" ? adminNav : employeeNav;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const BLUR_SIDEBAR = "blur(48px) saturate(220%) brightness(1.07)";
  const BLUR_HEADER  = "blur(32px) saturate(200%) brightness(1.05)";

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        background: bgMain,
        color:      textMain,
        transition: "background 0.5s cubic-bezier(0.22,1,0.36,1), color 0.4s ease",
      }}
    >
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <SceneBackground t={{ primary: "var(--tc-primary)", secondary: "var(--tc-secondary)", accent: "var(--tc-accent)" }} dark={dark} />
        <div style={{
          position: "absolute", top: "5%", left: "60%",
          width: "40vw", height: "40vw", borderRadius: "50%",
          background: "radial-gradient(circle, color-mix(in srgb, var(--tc-primary) 10%, transparent) 0%, transparent 70%)",
          filter: "blur(80px)", animation: "orbFloat2 22s ease-in-out infinite", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "8%", left: "8%",
          width: "32vw", height: "32vw", borderRadius: "50%",
          background: "radial-gradient(circle, color-mix(in srgb, var(--tc-secondary) 8%, transparent) 0%, transparent 70%)",
          filter: "blur(64px)", animation: "orbFloat3 18s ease-in-out infinite", pointerEvents: "none",
        }} />
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          md:relative md:translate-x-0`}
        style={{
          background:           sidebarBg,
          borderRight:          `1px solid ${borderCol}`,
          backdropFilter:       BLUR_SIDEBAR,
          WebkitBackdropFilter: BLUR_SIDEBAR,
          boxShadow:            edgeShadow,
          willChange:           "transform, opacity",
          transition:           "background 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.4s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Inner top sheen */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "28%",
          background: dark
            ? "linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 100%)"
            : "linear-gradient(to bottom, rgba(255,255,255,0.80) 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Logo */}
        <div className="px-5 py-5 relative z-10" style={{ borderBottom: `1px solid ${borderCol}` }}>
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
                boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.15)",
              }}
            >
              <Building2 className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h1 className="font-black text-sm tracking-tight" style={{ color: textMain }}>TCS iON</h1>
              <p className="text-[10px] tracking-widest font-mono" style={{ color: "var(--tc-primary)", opacity: 0.85 }}>STAFF PORTAL</p>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 relative z-10" style={{ borderBottom: `1px solid ${borderCol}` }}>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--tc-primary) 10%, transparent)",
              color:      "var(--tc-primary)",
              border:     "1px solid color-mix(in srgb, var(--tc-primary) 22%, transparent)",
              boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ animation: "pulse 2.4s ease-in-out infinite" }} />
            {role === "admin" ? "Administrator" : "Employee"}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto relative z-10" style={{ scrollbarWidth: "none" }}>
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <NavItem item={item} active={active} textMuted={textMuted} />
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 relative z-10" style={{ borderTop: `1px solid ${borderCol}` }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
                boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.22), 0 0 14px color-mix(in srgb, var(--tc-primary) 28%, transparent)",
              }}
            >
              {(userFullName ?? userEmail)?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: textMain }}>{userFullName ?? "User"}</p>
              <p className="text-[11px] truncate" style={{ color: textMuted }}>{userEmail}</p>
            </div>
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: textMuted, transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              e.currentTarget.style.color      = "#f87171";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color      = textMuted;
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </motion.button>
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
      <div className="flex-1 flex flex-col min-w-0 relative z-10" style={{ minWidth: 0, overflow: "visible" }}>
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
          style={{
            background:           headerBg,
            borderBottom:         `1px solid ${borderCol}`,
            backdropFilter:       BLUR_HEADER,
            WebkitBackdropFilter: BLUR_HEADER,
            boxShadow:            edgeShadow,
            position:             "relative",
            zIndex:               50,
            overflow:             "visible",
            transition:           "background 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.4s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* Header top sheen */}
          <div aria-hidden style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "50%",
            background: dark
              ? "linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 100%)"
              : "linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />

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
                ? <motion.span key="x"   initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}><X className="w-5 h-5" /></motion.span>
                : <motion.span key="mnu" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate:-90, opacity: 0 }} transition={{ duration: 0.18 }}><Menu className="w-5 h-5" /></motion.span>
              }
            </AnimatePresence>
          </motion.button>

          {/* Page title */}
          <div className="hidden md:block relative z-10">
            <h2 className="text-sm font-bold" style={{ color: textMain }}>
              {navItems.find(n => pathname.startsWith(n.href))?.label ?? "Portal"}
            </h2>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 ml-auto relative z-10">
            <NotificationPanel role={role} userId={userId} />
            <ThemePanel size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative">
          {mounted ? (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16, filter: "blur(5px)", scale: 0.99 }}
              animate={{ opacity: 1, y: 0,  filter: "blur(0px)", scale: 1.00 }}
              transition={{ duration: 0.30, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "opacity, transform, filter", minHeight: "100%" }}
            >
              <ErrorBoundary key={pathname}>
                {children}
              </ErrorBoundary>
            </motion.div>
          ) : (
            <div style={{ minHeight: "100%", opacity: 0 }}>
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}