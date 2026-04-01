"use client";
/**
 * app/page.tsx — Public Landing Page
 *
 * BRIDGE: DESIGN/src/pages/Home.jsx → TypeScript + Next.js
 *
 * Changes:
 *  - useNavigate → useRouter
 *  - Link (react-router-dom) → Link (next/link)
 *  - createPageUrl('EmployeeRegister') → '/register'
 *  - session.login() demo removed — real auth now at /login
 *  - Pixel-perfect design preserved: FloatingOrb, Card3D, FloatingCube, ThemePanel
 */

import React, { useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  CalendarDays, Users, Zap, Shield, ArrowRight, ChevronRight, LogIn,
} from "lucide-react";
import ThemePanel from "@/components/ThemePanel";

const features = [
  { icon: CalendarDays, title: "Smart Scheduling", desc: "Post exam shifts instantly. Employees self-select based on their availability with zero friction." },
  { icon: Users,        title: "Team Overview",    desc: "Live dashboard showing who's confirmed, pending, or completed across all exam centres." },
  { icon: Zap,          title: "WhatsApp Alerts",  desc: "Instant automated notifications delivered to employee WhatsApp the moment shifts open." },
  { icon: Shield,       title: "Secure Profiles",  desc: "Admin-verified identities with ID proof, bank details, and photo on record before access." },
];

// ── 3D Card component ─────────────────────────────────────────────────────────
function Card3D({ children, className, style, depth = 15 }: {
  children: React.ReactNode; className?: string;
  style?: React.CSSProperties; depth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotX = useSpring(useTransform(rawY, [-0.5, 0.5], [depth, -depth]), { stiffness: 240, damping: 30 });
  const rotY = useSpring(useTransform(rawX, [-0.5, 0.5], [-depth, depth]), { stiffness: 240, damping: 30 });
  const z    = useSpring(0, { stiffness: 220, damping: 24 });

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref} onMouseMove={onMove}
      onMouseEnter={() => z.set(20)}
      onMouseLeave={() => { rawX.set(0); rawY.set(0); z.set(0); }}
      style={{ rotateX: rotX, rotateY: rotY, translateZ: z, transformStyle: "preserve-3d", perspective: 1000, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Floating decorative cube ──────────────────────────────────────────────────
function FloatingCube({ size, x, y, color, delay }: { size: number; x: string; y: string; color: string; delay: number }) {
  // color is always a CSS var string like "var(--tc-primary)"
  const c13 = `color-mix(in srgb, ${color} 13%, transparent)`;
  const c27 = `color-mix(in srgb, ${color} 27%, transparent)`;
  const c9  = `color-mix(in srgb, ${color} 9%, transparent)`;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay, duration: 1.5 }}
      style={{ position: "absolute", left: x, top: y, width: size, height: size, perspective: 500 }}
    >
      <motion.div
        animate={{ rotateX: [0, 20, 0], rotateY: [0, 35, 0], y: [0, -14, 0] }}
        transition={{ duration: 7 + delay * 2, repeat: Infinity, ease: "easeInOut", delay }}
        style={{
          width: size, height: size, borderRadius: 10,
          background: `linear-gradient(135deg, ${c13} 0%, ${c27} 100%)`,
          border: `1px solid ${c27}`,
          boxShadow: `0 0 30px ${c9}`,
          transformStyle: "preserve-3d",
        }}
      />
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { dark, theme: t } = useTheme();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  }, [mouseX, mouseY]);

  const darkBg  = "linear-gradient(135deg, #07070f 0%, #0a0820 40%, #060d1a 100%)";
  const lightBg = "linear-gradient(135deg, #f0f0ff 0%, #e8e4ff 40%, #eef6ff 100%)";
  const bgMain  = dark ? darkBg : lightBg;
  const textMain  = dark ? "#ffffff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,200,230,0.5)" : "rgba(30,20,80,0.5)";
  const cardBg    = dark ? "rgba(12,10,30,0.7)"   : "rgba(255,255,255,0.85)";
  const navBg     = dark ? "rgba(7,7,18,0.75)"    : "rgba(240,238,255,0.85)";

  return (
    <div
      onMouseMove={onMouseMove}
      style={{ minHeight: "100vh", overflowX: "hidden", background: bgMain, color: textMain, transition: "background 0.6s ease, color 0.4s ease" }}
    >
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="orb-1 absolute rounded-full gpu"
          style={{ left: "5%", top: "5%", width: "50vw", height: "50vw", background: `radial-gradient(circle, color-mix(in srgb, var(--tc-primary) 16%, transparent) 0%, transparent 70%)`, filter: "blur(40px)", willChange: "filter" }} />
        <div className="orb-2 absolute rounded-full gpu"
          style={{ left: "55%", top: "50%", width: "40vw", height: "40vw", background: `radial-gradient(circle, color-mix(in srgb, var(--tc-secondary) 16%, transparent) 0%, transparent 70%)`, filter: "blur(40px)", willChange: "filter" }} />
        <div className="orb-3 absolute rounded-full gpu"
          style={{ left: "70%", top: "10%", width: "30vw", height: "30vw", background: `radial-gradient(circle, color-mix(in srgb, var(--tc-accent) 16%, transparent) 0%, transparent 70%)`, filter: "blur(40px)", willChange: "filter" }} />
      </div>

      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: dark ? 0.15 : 0.08, backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--tc-primary) 40%, transparent) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

      {/* Floating cubes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <FloatingCube size={55} x="7%"  y="15%" color="var(--tc-primary)"   delay={0.2} />
        <FloatingCube size={30} x="82%" y="8%"  color="var(--tc-secondary)" delay={0.6} />
        <FloatingCube size={65} x="85%" y="55%" color="var(--tc-accent)"    delay={0.4} />
        <FloatingCube size={38} x="3%"  y="68%" color="var(--tc-secondary)" delay={0.9} />
        <FloatingCube size={22} x="60%" y="82%" color="var(--tc-primary)"   delay={1.1} />
        <FloatingCube size={48} x="42%" y="6%"  color="var(--tc-accent)"    delay={1.3} />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-30 px-6 md:px-16 py-4 flex items-center justify-between sticky top-0"
        style={{ borderBottom: `1px solid color-mix(in srgb, var(--tc-primary) 12%, transparent)`, backdropFilter: "blur(20px) saturate(250%)", background: navBg, transition: "background 0.5s ease" }}
      >
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, boxShadow: `0 0 20px color-mix(in srgb, var(--tc-primary) 33%, transparent)` }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide" style={{ color: textMain }}>TCS iON</span>
            <p className="text-[10px] tracking-widest" style={{ color: "var(--tc-primary)" }}>STAFF PORTAL</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex items-center gap-2">
          <ThemePanel size="md" />

          <Link href="/register">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              style={{ border: `1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)`, color: "var(--tc-secondary)", background: `color-mix(in srgb, var(--tc-primary) 6%, transparent)` }}>
              Register
            </motion.button>
          </Link>

          <Link href="/login">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, boxShadow: `0 0 15px color-mix(in srgb, var(--tc-primary) 27%, transparent)` }}>
              <LogIn className="w-4 h-4" /> Sign In
            </motion.button>
          </Link>
        </motion.div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 px-6 md:px-16 lg:px-24 pt-20 pb-24 min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-wide"
            style={{ background: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`, border: `1px solid color-mix(in srgb, var(--tc-primary) 21%, transparent)`, color: "var(--tc-secondary)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--tc-primary)" }} />
            TCS ION · EXAM WORKFORCE PLATFORM · INDIA
          </motion.div>

          <div className="mb-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              <div className="text-5xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tight" style={{ color: textMain }}>
                Manage Your
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              <div className="tc-gradient-text text-5xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tight">
                Exam Workforce
              </div>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}
            className="text-lg max-w-2xl mt-6 mb-10 leading-relaxed" style={{ color: textMuted }}>
            Streamline shift scheduling for TCS iON exam centres across India. Employees pick availability, admins get full visibility — all from one platform.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center gap-4 flex-wrap">
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.02, boxShadow: `0 14px 40px color-mix(in srgb, var(--tc-primary) 50%, transparent)` }} whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, boxShadow: `0 8px 30px color-mix(in srgb, var(--tc-primary) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)`, willChange: "transform, box-shadow" }}>
                <LogIn className="w-4 h-4" /> Admin Login <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/register">
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-300"
                style={{ border: `1px solid color-mix(in srgb, var(--tc-primary) 16%, transparent)`, color: "var(--tc-secondary)", background: `color-mix(in srgb, var(--tc-primary) 3%, transparent)` }}>
                Employee Register <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Floating hero dashboard preview card */}
        <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2">
          <Card3D depth={12}>
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-80 p-6"
              style={{ borderRadius: "var(--radius)", background: cardBg, border: `1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)`, backdropFilter: "blur(32px) saturate(250%)", boxShadow: `0 30px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)` }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))` }}>
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: textMain }}>Live Dashboard</p>
                  <p className="text-[10px]" style={{ color: "var(--tc-primary)" }}>Today&apos;s Shifts</p>
                </div>
                <span className="ml-auto text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>● LIVE</span>
              </div>
              {[
                { name: "Priya Sharma",  shift: "Shift 1 · 9AM", status: "confirmed", color: "#34d399" },
                { name: "Rajesh Kumar",  shift: "Shift 2 · 2PM", status: "pending",   color: "#f59e0b" },
                { name: "Anil Verma",    shift: "Shift 1 · 9AM", status: "completed", color: "var(--tc-primary)" },
              ].map((e, i) => (
                <motion.div key={e.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 + i * 0.15 }}
                  className="flex items-center gap-3 py-2.5 border-t" style={{ borderColor: `color-mix(in srgb, var(--tc-primary) 8%, transparent)` }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: `${e.color}44`, border: `1px solid ${e.color}66` }}>{e.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: textMain }}>{e.name}</p>
                    <p className="text-[10px]" style={{ color: textMuted }}>{e.shift}</p>
                  </div>
                  <span className="text-[9px] font-bold capitalize" style={{ color: e.color }}>{e.status}</span>
                </motion.div>
              ))}
              <div className="mt-4 pt-4 border-t flex justify-between" style={{ borderColor: `color-mix(in srgb, var(--tc-primary) 8%, transparent)` }}>
                <span className="text-[10px]" style={{ color: textMuted }}>Total Shifts Today</span>
                <span className="text-xs font-black" style={{ color: "var(--tc-primary)" }}>24 Active</span>
              </div>
            </motion.div>
          </Card3D>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 px-6 md:px-16 lg:px-24 py-20" style={{ borderTop: `1px solid color-mix(in srgb, var(--tc-primary) 7%, transparent)` }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mb-14 text-center">
          <p className="text-xs tracking-[0.4em] mb-3" style={{ color: "var(--tc-primary)" }}>PLATFORM CAPABILITIES</p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: textMain }}>Everything You Need</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <Card3D depth={18} className="h-full" style={{ height: "100%" }}>
                <div className="h-full p-6" style={{ borderRadius: "var(--radius)", background: cardBg, border: `1px solid color-mix(in srgb, var(--tc-primary) 15%, transparent)`, backdropFilter: "blur(24px) saturate(180%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                  <motion.div whileHover={{ scale: 1.15, rotate: 5 }} transition={{ duration: 0.4 }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 20%, transparent), color-mix(in srgb, var(--tc-primary) 7%, transparent))`, border: `1px solid color-mix(in srgb, var(--tc-primary) 27%, transparent)` }}>
                    <f.icon className="w-6 h-6" style={{ color: "var(--tc-primary)" }} />
                  </motion.div>
                  <h3 className="font-bold mb-2 text-sm" style={{ color: textMain }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: textMuted }}>{f.desc}</p>
                  <div className="mt-4 h-px w-full rounded-full" style={{ background: `linear-gradient(to right, color-mix(in srgb, var(--tc-primary) 27%, transparent), transparent)` }} />
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid color-mix(in srgb, var(--tc-primary) 7%, transparent)` }}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "100%", label: "Digital Workflow", sub: "Zero paperwork" },
            { value: "Live",  label: "Real-time Updates", sub: "Instant sync" },
            { value: "Secure", label: "Verified Profiles", sub: "ID checked" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
              <Card3D depth={10}>
                <div className="text-center py-8 px-4 rounded-2xl" style={{ background: `color-mix(in srgb, var(--tc-primary) 3%, transparent)`, border: `1px solid color-mix(in srgb, var(--tc-primary) 8%, transparent)` }}>
                  <p className="tc-gradient-text text-4xl md:text-5xl font-black mb-1">{s.value}</p>
                  <p className="text-sm font-semibold" style={{ color: textMain }}>{s.label}</p>
                  <p className="text-xs mt-1" style={{ color: textMuted }}>{s.sub}</p>
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-16 lg:px-24 pb-24 pt-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
          <div className="relative rounded-3xl p-12 text-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 9%, transparent) 0%, color-mix(in srgb, var(--tc-secondary) 7%, transparent) 50%, color-mix(in srgb, var(--tc-accent) 4%, transparent) 100%)`, border: `1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)`, backdropFilter: "blur(20px)" }}>
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: textMain }}>Ready to get started?</h2>
            <p className="text-sm mb-8" style={{ color: textMuted }}>Join TCS iON examination centres across India on this platform.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/login">
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white"
                  style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, boxShadow: `0 0 25px color-mix(in srgb, var(--tc-primary) 27%, transparent)` }}>
                  <LogIn className="w-4 h-4" /> Admin Login <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="px-8 py-4 rounded-2xl font-bold transition-all"
                  style={{ border: `1px solid color-mix(in srgb, var(--tc-primary) 27%, transparent)`, color: "var(--tc-secondary)", background: `color-mix(in srgb, var(--tc-primary) 6%, transparent)` }}>
                  Employee Register
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 px-6 md:px-16 py-6 flex items-center justify-between"
        style={{ borderTop: `1px solid color-mix(in srgb, var(--tc-primary) 7%, transparent)`, color: textMuted, fontSize: 11 }}>
        <span>TCS iON Staff Portal © 2026</span>
        <span style={{ color: "var(--tc-primary)" }}>● ONLINE</span>
      </footer>
    </div>
  );
}
