"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";

export function AuthLayout3D({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#070707] flex items-center justify-center overflow-hidden font-sans">
      {/* ── 3D Decorative Elements ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-[500px] h-[500px]">
          
          {/* Top Left Red Angled Bar */}
          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [-40, -35, -40] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[0%] w-6 h-20 rounded-md bg-gradient-to-br from-[#ff4d79] to-[#c3144a]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.4)"
            }}
          />

          {/* Small Red Sphere Left */}
          <motion.div
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[50%] left-[-8%] w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4d79] to-[#c3144a]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.5)"
            }}
          />

          {/* Bottom Left Yellow Cylinder */}
          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [45, 50, 45] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[20%] left-[5%] w-8 h-24 rounded-full bg-gradient-to-br from-[#ffd54f] to-[#e6a000]"
            style={{
              boxShadow: "inset -3px -3px 8px rgba(0,0,0,0.3), inset 3px 3px 8px rgba(255,255,255,0.6)"
            }}
          />

          {/* Top Right Yellow Arc */}
          <motion.div
            animate={{ y: [4, -4, 4], rotate: [-20, -15, -20] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[12%] right-[12%] w-16 h-8 rounded-t-full bg-gradient-to-br from-[#ffd54f] to-[#e6a000]"
            style={{
              boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.6)"
            }}
          />

          {/* Right Red Capsule */}
          <motion.div
            animate={{ y: [-8, 8, -8], rotate: [30, 25, 30] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[25%] right-[-10%] w-24 h-40 rounded-full bg-gradient-to-br from-[#ff4d79] to-[#c3144a]"
            style={{
              boxShadow: "inset -6px -6px 16px rgba(0,0,0,0.3), inset 6px 6px 16px rgba(255,255,255,0.5), 0 10px 20px rgba(0,0,0,0.4)"
            }}
          />

          {/* Bottom Right Small Yellow Cylinder */}
          <motion.div
            animate={{ y: [3, -3, 3], rotate: [30, 35, 30] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[25%] right-[2%] w-5 h-12 rounded-full bg-gradient-to-br from-[#ffd54f] to-[#e6a000]"
            style={{
              boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.6)"
            }}
          />

          {/* Bottom Right Huge Shadow Sphere */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-15%] right-[5%] w-48 h-48 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#050505]"
            style={{
              boxShadow: "inset -5px -5px 15px rgba(0,0,0,0.8), inset 5px 5px 15px rgba(255,255,255,0.05)"
            }}
          />

          {/* Bottom Center Red Sphere */}
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[5%] left-[40%] w-32 h-32 rounded-full z-20 bg-gradient-to-br from-[#ff6b9e] to-[#ba0f3e]"
            style={{
              boxShadow: "inset -8px -8px 20px rgba(0,0,0,0.3), inset 8px 8px 20px rgba(255,255,255,0.6), 0 10px 30px rgba(0,0,0,0.5)"
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
