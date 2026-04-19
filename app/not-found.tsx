"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Home, ChevronLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * app/not-found.tsx — Global 404 Page
 * 
 * Provides a premium recovery UI when a user navigates to a non-existent page 
 * or lacks permission to view a resource.
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#07070f] text-[#f0eeff] font-sans selection:bg-indigo-500/30">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Glow edge overlay */}
          <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <Compass className="w-8 h-8 text-indigo-500" />
            <span className="sr-only">404</span>
          </div>

          <h1 className="text-2xl font-black mb-2 tracking-tight">Page Not Found</h1>
          <p className="text-sm text-indigo-200/60 leading-relaxed mb-8 px-2">
            The page you're looking for doesn't exist or you don't have permission to view it.
          </p>

          <div className="grid grid-cols-1 w-full gap-3">
            <Link href="/" className="w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
              >
                <Home className="w-4 h-4" /> Go to Dashboard
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </motion.button>
          </div>

          <Link href="/">
            <button 
              className="mt-6 text-[10px] font-bold tracking-widest text-indigo-400/50 hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" /> RETURN HOME
            </button>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
