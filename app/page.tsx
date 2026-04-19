"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Volume2, VolumeX } from "lucide-react";
import ThemePanel from "@/components/ThemePanel";
import HeroBackground from "@/components/landing/HeroBackground";

// Import CrystalCube as client-only to avoid SSR hydration issues with Three.js
const CrystalCube = dynamic(() => import("@/components/landing/CrystalCube"), { 
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-white/5 rounded-full blur-3xl opacity-50" />
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-white overflow-hidden selection:bg-red-500/30 font-sans">
      <HeroBackground />
      
      {/* 3D Cube Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center -translate-y-[8vh]">
        <div className="w-[100vw] h-[100vw] sm:w-[80vw] sm:h-[80vw] max-w-[800px] max-h-[800px] pointer-events-auto">
          {mounted && <CrystalCube />}
        </div>
      </div>

      {/* Floating Navbar */}
      <nav className="relative z-50 pt-6 px-6 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-6 px-3 py-2.5 rounded-full"
          style={{ 
            background: "rgba(15, 15, 20, 0.5)", 
            backdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
          }}
        >
          {/* Logo / Icon */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff5555] to-[#ffaa00] flex items-center justify-center p-[2px] ml-1 shadow-[0_0_15px_rgba(255,0,0,0.3)]">
            <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#ff4444] rotate-45 rounded-[2px]" />
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-7 px-4 text-[13px] font-semibold text-gray-400 tracking-wide">
            <Link href="#build" className="hover:text-white transition-colors duration-300">Build</Link>
            <Link href="#explore" className="hover:text-white transition-colors duration-300">Explore</Link>
            <Link href="#ecosystem" className="hover:text-white transition-colors duration-300">Ecosystem</Link>
            <Link href="#about" className="hover:text-white transition-colors duration-300">About</Link>
            <Link href="#socials" className="hover:text-white transition-colors duration-300">Socials</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemePanel size="sm" />
            <Link href="/employee/login">
              <button className="px-6 py-2.5 bg-white text-black font-bold text-[13px] rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95">
                Connect
              </button>
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-40 max-w-[1400px] mx-auto px-6 h-[calc(100vh-100px)] flex flex-col justify-end pb-[8vh] pointer-events-none">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12 w-full pointer-events-auto">
          
          {/* Left: Huge Heading */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            <h1 className="text-[12vw] lg:text-[9.5rem] font-medium tracking-[-0.04em] leading-[0.85] text-white drop-shadow-2xl">
              Built for<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">Builders</span>
            </h1>
          </motion.div>

          {/* Right: Description & CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[420px] flex flex-col gap-8 pb-3"
          >
            <div className="font-mono text-[13px] leading-[1.8] text-gray-300 tracking-tight" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              Experience blazing-fast transactions,<br />
              unmatched security, and Ethereum<br />
              compatibility with our optimistic<br />
              rollup solution for TCS iON.
            </div>
            
            <div className="flex items-center gap-4 mt-2">
              <Link href="/employee/login" className="flex-1">
                <button className="w-full py-4 text-sm font-bold text-white rounded-2xl bg-gradient-to-br from-[#ff3333] to-[#cc1111] shadow-[0_8px_30px_rgba(255,50,50,0.3)] hover:shadow-[0_12px_40px_rgba(255,50,50,0.5)] active:scale-[0.98] transition-all">
                  Start Building
                </button>
              </Link>
              <Link href="/admin/login" className="flex-1">
                <button className="w-full py-4 text-sm font-bold text-white rounded-2xl bg-[#1a1a20] border border-white/10 hover:bg-[#252530] active:scale-[0.98] transition-all">
                  Read docs
                </button>
              </Link>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Floating Sound Toggle */}
      <motion.button 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        onClick={() => setMuted(!muted)}
        className="absolute bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-white/5 border border-white/10 backdrop-blur-[20px] flex items-center justify-center hover:bg-white/10 transition-colors group cursor-pointer"
      >
        {muted ? <VolumeX size={18} className="text-gray-400 group-hover:text-white" /> : <Volume2 size={18} className="text-gray-400 group-hover:text-white" />}
      </motion.button>
    </div>
  );
}
