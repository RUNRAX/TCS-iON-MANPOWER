"use client";
/**
 * app/page.tsx — Public Landing Page
 * Full 3D redesign with molecular physics and scrolling reactive sections.
 */

import React, { useRef, useState, useEffect, Suspense } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  CalendarDays, Users, Zap, Shield, ArrowRight, LogIn, ChevronDown
} from "lucide-react";
import ThemePanel from "@/components/ThemePanel";
import dynamic from "next/dynamic";
import ScrollSection from "@/components/landing/ScrollSection";

// Dynamically import 3D engine to prevent any SSR evaluation of Canvas/Three.js
const LandingCanvas = dynamic(() => import("@/components/landing/LandingCanvas"), { 
  ssr: false,
  loading: () => <div className="landing-canvas-container" />
});

const features = [
  { icon: CalendarDays, title: "Smart Scheduling", desc: "Post exam shifts instantly. Employees self-select based on their availability with zero friction." },
  { icon: Users, title: "Team Overview", desc: "Live dashboard showing who's confirmed, pending, or completed across all exam centres." },
  { icon: Zap, title: "WhatsApp Alerts", desc: "Instant automated notifications delivered to employee WhatsApp the moment shifts open." },
  { icon: Shield, title: "Secure Profiles", desc: "Admin-verified identities with ID proof, bank details, and photo on record before access." },
];

export default function Home() {
  const router = useRouter();
  const { dark } = useTheme();
  
  // Track scroll for parallax and 3D tie-ins
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });
  
  // Simple state to pass scroll to 3D canvas
  const [scrollProp, setScrollProp] = useState(0);
  useEffect(() => {
    return smoothScroll.on("change", (latest) => setScrollProp(latest));
  }, [smoothScroll]);

  const textMain = dark ? "#ffffff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,200,230,0.6)" : "rgba(30,20,80,0.6)";
  const cardBg = dark ? "rgba(12,10,24,0.65)" : "rgba(255,255,255,0.75)";
  const navBg = dark ? "rgba(7,7,14,0.75)" : "rgba(250,250,250,0.75)";

  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden", color: textMain }}>
      
      {/* 3D Background Canvas */}
      <LandingCanvas scrollProgress={scrollProp} />

      {/* NAVBAR */}
      <nav className="relative z-30 px-6 md:px-16 py-4 flex items-center justify-between sticky top-0"
        style={{ borderBottom: `1px solid color-mix(in srgb, var(--tc-primary) 8%, transparent)`, backdropFilter: "blur(40px) saturate(200%)", background: navBg, transition: "background 0.5s ease" }}
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

          <div className="flex gap-2">
            <Link href="/admin/login">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: `color-mix(in srgb, var(--tc-primary) 10%, transparent)`, border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)`, color: "var(--tc-primary)" }}>
                <Shield className="w-4 h-4" /> Admin
              </motion.button>
            </Link>
            <Link href="/employee/login">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, boxShadow: `0 0 15px color-mix(in srgb, var(--tc-primary) 27%, transparent)` }}>
                <LogIn className="w-4 h-4" /> Employee
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* HERO (Centered Layout) */}
      <section className="relative z-10 px-6 md:px-16 lg:px-24 pt-24 pb-32 min-h-[90vh] flex flex-col justify-center items-center text-center pointer-events-none">
        
        {/* Enable pointers just for the button container so we can click through background */}
        <div className="max-w-4xl flex flex-col items-center pointer-events-auto w-full">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold mb-8 tracking-wider shadow-lg"
            style={{ 
              background: dark ? `rgba(20,15,5,0.6)` : `rgba(255,255,255,0.8)`, 
              border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)`, 
              color: dark ? "#fdfdfd" : "#111",
              backdropFilter: "blur(12px)"
            }}>
            <span className="w-2 h-2 rounded-full animate-pulse glow-primary" style={{ background: "var(--tc-primary)" }} />
            TCS ION • EXAM WORKFORCE PLATFORM
          </motion.div>

          <div className="mb-6 w-full">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.95] tracking-tight pb-2" style={{ color: textMain }}>
                Manage Your
              </h1>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              <div className="text-glow-gold tc-gradient-text text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.95] tracking-tight pb-2">
                Exam Workforce
              </div>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}
            className="text-lg md:text-xl max-w-2xl mt-4 mb-12 flex-1 font-medium leading-relaxed" style={{ color: textMuted }}>
            Streamline shift scheduling for TCS iON exam centres across India. Employees pick availability, admins get full visibility — powered by real-time intelligence.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/employee/login">
              <motion.button whileHover={{ scale: 1.05, boxShadow: `0 14px 40px color-mix(in srgb, var(--tc-primary) 40%, transparent)` }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-10 py-4 rounded-full font-bold text-white shadow-xl text-lg"
                style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))`, boxShadow: `0 8px 30px color-mix(in srgb, var(--tc-primary) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)` }}>
                <LogIn className="w-5 h-5" /> Employee Login
              </motion.button>
            </Link>
            <Link href="/admin/login">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-10 py-4 rounded-full font-bold text-lg"
                style={{ 
                  background: dark ? `rgba(20,20,30,0.5)` : `rgba(255,255,255,0.6)`, 
                  backdropFilter: "blur(12px)", 
                  border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)`, 
                  color: textMain 
                }}>
                <Shield className="w-5 h-5" /> Admin Portal
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 scroll-indicator">
          <ChevronDown className="w-8 h-8 opacity-50" style={{ color: textMain }} />
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 px-6 md:px-16 lg:px-24 py-24" style={{ borderTop: `1px solid color-mix(in srgb, var(--tc-primary) 10%, transparent)` }}>
        <ScrollSection>
          <div className="mb-16 text-center">
            <p className="text-xs tracking-[0.4em] mb-4 font-bold" style={{ color: "var(--tc-primary)" }}>PLATFORM CAPABILITIES</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black" style={{ color: textMain }}>Everything You Need</h2>
          </div>
        </ScrollSection>
        
        <ScrollSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={f.title} className="h-full rounded-[var(--radius-xl)] p-8 transition-all hover:scale-105 duration-300"
              style={{ background: cardBg, border: `1px solid color-mix(in srgb, var(--tc-primary) 15%, transparent)`, backdropFilter: "blur(32px) saturate(200%)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 20%, transparent), color-mix(in srgb, var(--tc-primary) 5%, transparent))`, border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)` }}>
                <f.icon className="w-7 h-7" style={{ color: "var(--tc-primary)" }} />
              </div>
              <h3 className="font-bold mb-3 text-lg" style={{ color: textMain }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{f.desc}</p>
            </div>
          ))}
        </ScrollSection>
      </section>

      {/* STATS */}
      <section className="relative z-10 px-6 md:px-16 lg:px-24 py-20" style={{ borderTop: `1px solid color-mix(in srgb, var(--tc-primary) 10%, transparent)` }}>
        <ScrollSection className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { value: "100%", label: "Digital Workflow", sub: "Speed up processes natively" },
            { value: "Live", label: "Real-time Updates", sub: "Instant synchronization" },
            { value: "Secure", label: "Verified Profiles", sub: "Bank & ID authenticated" },
          ].map((s, i) => (
            <div key={s.label} className="text-center py-12 px-6 rounded-[var(--radius-2xl)] transition-all hover:scale-105 duration-300" 
              style={{ background: `color-mix(in srgb, var(--tc-primary) 4%, transparent)`, border: `1px solid color-mix(in srgb, var(--tc-primary) 12%, transparent)`, backdropFilter: "blur(20px)" }}>
              <p className="tc-gradient-text text-5xl md:text-6xl font-black mb-2">{s.value}</p>
              <p className="text-base font-bold" style={{ color: textMain }}>{s.label}</p>
              <p className="text-sm mt-2" style={{ color: textMuted }}>{s.sub}</p>
            </div>
          ))}
        </ScrollSection>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-16 lg:px-24 pb-32 pt-16">
        <ScrollSection>
          <div className="relative rounded-[var(--radius-2xl)] p-12 md:p-20 text-center overflow-hidden shadow-2xl"
            style={{ background: dark ? `rgba(16,14,24,0.8)` : `rgba(255,255,255,0.85)`, border: `1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)`, backdropFilter: "blur(40px)" }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at center, var(--tc-primary) 0%, transparent 60%)` }} />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4" style={{ color: textMain }}>Ready to get started?</h2>
              <p className="text-base md:text-lg mb-10" style={{ color: textMuted }}>Join TCS iON examination centres across India on this platform. Secure, fast, and scalable.</p>
              
              <div className="flex items-center justify-center gap-5 flex-wrap">
                <Link href="/employee/login">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))` }}>
                    <LogIn className="w-5 h-5" /> Employee Access
                  </motion.button>
                </Link>
                <Link href="/admin/login">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-8 py-4 rounded-full font-bold"
                    style={{ background: `color-mix(in srgb, var(--tc-primary) 10%, transparent)`, border: `1px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)`, color: textMain }}>
                    <Shield className="w-5 h-5" /> Admin Control
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollSection>
      </section>

      <footer className="relative z-10 px-6 md:px-16 py-8 flex items-center justify-between group"
        style={{ borderTop: `1px solid color-mix(in srgb, var(--tc-primary) 10%, transparent)`, color: textMuted, fontSize: 13, background: dark ? '#050505' : '#f5f5f5' }}>
        <span className="font-medium">TCS iON Staff Portal © 2026</span>
        <div className="flex items-center gap-6">
          <Link href="/super/login" className="opacity-0 hover:opacity-100 transition-opacity duration-500 font-bold px-3 py-1.5 rounded-lg text-xs" 
            style={{ background: 'color-mix(in srgb, var(--tc-primary) 10%, transparent)', color: "var(--tc-primary)" }}>
            Super Admin
          </Link>
          <span className="flex items-center gap-2 font-bold" style={{ color: "var(--tc-primary)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--tc-primary)" }} /> ONLINE
          </span>
        </div>
      </footer>
    </div>
  );
}
