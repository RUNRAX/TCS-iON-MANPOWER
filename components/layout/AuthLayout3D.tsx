"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";

export function AuthLayout3D({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#070707] flex items-center justify-center overflow-hidden font-sans">
      {/* ── 3D Decorative Elements ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-[500px] h-[500px]">
          {/* Top Left Copper Angled Bar */}
          <motion.div
            animate={{ y: [-10, 10, -10], rotate: [-40, -25, -40], x: [-5, 5, -5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[0%] w-6 h-20 rounded-md bg-gradient-to-br from-[#ea580c] to-[#9a3412]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.5), inset 2px 2px 6px rgba(255,255,255,0.4)"
            }}
          />

          {/* Small Orange Sphere Left */}
          <motion.div
            animate={{ y: [8, -8, 8], scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[50%] left-[-8%] w-8 h-8 rounded-full bg-gradient-to-br from-[#f97316] to-[#c2410c]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.5), inset 2px 2px 6px rgba(255,255,255,0.5)"
            }}
          />

          {/* Bottom Left Amber Cylinder */}
          <motion.div
            animate={{ y: [-8, 8, -8], rotate: [45, 60, 45], x: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[20%] left-[5%] w-8 h-24 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#b45309]"
            style={{
              boxShadow: "inset -3px -3px 8px rgba(0,0,0,0.4), inset 3px 3px 8px rgba(255,255,255,0.5)"
            }}
          />

          {/* Top Right Amber Arc */}
          <motion.div
            animate={{ y: [6, -6, 6], rotate: [-20, -5, -20] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[12%] right-[12%] w-16 h-8 rounded-t-full bg-gradient-to-br from-[#fbbf24] to-[#d97706]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.6)"
            }}
          />

          {/* Right Fiery Capsule */}
          <motion.div
            animate={{ y: [-15, 15, -15], rotate: [30, 15, 30], x: [5, -5, 5] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[25%] right-[-10%] w-24 h-40 rounded-full bg-gradient-to-br from-[#ea580c] to-[#7c2d12]"
            style={{
              boxShadow: "inset -6px -6px 16px rgba(0,0,0,0.5), inset 6px 6px 16px rgba(255,255,255,0.4), 0 10px 25px rgba(234,88,12,0.3)"
            }}
          />

          {/* Bottom Right Small Amber Cylinder */}
          <motion.div
            animate={{ y: [4, -4, 4], rotate: [30, 45, 30] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[25%] right-[2%] w-5 h-12 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#b45309]"
            style={{
              boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.6)"
            }}
          />

          {/* Bottom Right Huge Shadow Sphere */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-15%] right-[5%] w-48 h-48 rounded-full bg-gradient-to-br from-[#1a100c] to-[#050302]"
            style={{
              boxShadow: "inset -5px -5px 15px rgba(0,0,0,0.9), inset 5px 5px 15px rgba(255,160,100,0.03)"
            }}
          />

          {/* Bottom Right Deep Orange Sphere (Shifted from Center) */}
          <motion.div
            animate={{ y: [-12, 12, -12], x: [-8, 8, -8] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[2%] right-[10%] w-32 h-32 rounded-full z-20 bg-gradient-to-br from-[#f97316] to-[#9a3412]"
            style={{
              boxShadow: "inset -8px -8px 20px rgba(0,0,0,0.4), inset 8px 8px 20px rgba(255,255,255,0.5), 0 15px 35px rgba(234,88,12,0.4)"
            }}
          />

        </div>
      </div>

      {/* ── Crown Icon Logo ── */}
      <div className="absolute bottom-10 left-10 w-14 h-14 rounded-full bg-[#111] flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-white/5">
        <Crown size={24} className="text-[#fbbb29] fill-[#fbbb29]" />
      </div>

      {children}
    </div>
  );
}
