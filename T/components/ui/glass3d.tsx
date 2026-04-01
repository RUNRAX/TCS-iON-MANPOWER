"use client";
/**
 * components/ui/glass3d.tsx  — iOS 26.4 "Liquid Glass" Material System
 *
 * Every component here implements Apple's three-layer glass model:
 *   Layer 1: Backdrop blur + saturation (the frosted lens)
 *   Layer 2: Semi-transparent fill     (the tinted glass body)
 *   Layer 3: Edge lighting via inset box-shadow (the 3D chamfer)
 *
 * Exports:
 *   GlassCard        — 3D-tilt card with mouse-parallax + glow border
 *   GlassPanel       — Static glass surface (sidebar / header / modal)
 *   GlassSheet       — Full bottom-sheet / modal surface
 *   FloatingCube     — Decorative animated 3D cube
 *   SceneBackground  — Full-screen orbs + dot-grid + cubes
 *   GlassButton      — Spring-physics gradient button
 *   GlassBadge       — Pill status badge
 *   GlassDivider     — Glass-rule separator
 */

import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

/* ─────────────────────────────────────────────────────────────────────────────
   Material token helpers
───────────────────────────────────────────────────────────────────────────── */
const EDGE = {
  dark: {
    border:    "rgba(255,255,255,0.10)",
    topLight:  "rgba(255,255,255,0.20)",
    botShadow: "rgba(0,0,0,0.16)",
    lateralL:  "rgba(255,255,255,0.09)",
    lateralR:  "rgba(255,255,255,0.04)",
  },
  light: {
    border:    "rgba(255,255,255,0.85)",
    topLight:  "rgba(255,255,255,0.98)",
    botShadow: "rgba(0,0,0,0.04)",
    lateralL:  "rgba(255,255,255,0.80)",
    lateralR:  "rgba(255,255,255,0.60)",
  },
};

const edgeShadow = (dark: boolean) => {
  const e = dark ? EDGE.dark : EDGE.light;
  const outerDark = dark
    ? "0 16px 56px -8px rgba(0,0,0,0.45), 0 4px 16px -4px rgba(0,0,0,0.22)"
    : "0 8px 32px -4px rgba(0,0,0,0.10), 0 2px 8px -2px  rgba(0,0,0,0.06)";
  return [
    `inset 0 1.5px 0 ${e.topLight}`,
    `inset 0 -1px  0 ${e.botShadow}`,
    `inset 1px 0   0 ${e.lateralL}`,
    `inset -1px 0  0 ${e.lateralR}`,
    outerDark,
  ].join(", ");
};

/* ─────────────────────────────────────────────────────────────────────────────
   GlassCard — interactive 3D-tilt glassmorphic card
───────────────────────────────────────────────────────────────────────────── */
export interface GlassCardProps {
  children:    React.ReactNode;
  className?:  string;
  style?:      React.CSSProperties;
  /** Tilt angle in degrees (default 14) */
  depth?:      number;
  /** Levitation on hover (default true) */
  levitate?:   boolean;
  /** Disables 3D tilt — useful for small / inline elements */
  noTilt?:     boolean;
  onClick?:    () => void;
  /** Override the glass fill opacity (0–1, default picks from dark/light token) */
  fillOpacity?: number;
}

export function GlassCard({
  children,
  className,
  style,
  depth = 14,
  levitate = true,
  noTilt = false,
  onClick,
  fillOpacity,
}: GlassCardProps) {
  const { dark } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  /* Pointer tracking */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const rotX = useSpring(useTransform(rawY, [-0.5, 0.5], [ depth, -depth]), {
    stiffness: 260, damping: 32,
  });
  const rotY = useSpring(useTransform(rawX, [-0.5, 0.5], [-depth,  depth]), {
    stiffness: 260, damping: 32,
  });
  const z           = useSpring(0, { stiffness: 230, damping: 26 });
  const glowOpacity = useSpring(0, { stiffness: 230, damping: 26 });

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (noTilt) return;
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      rawX.set((e.clientX - r.left) / r.width  - 0.5);
      rawY.set((e.clientY - r.top)  / r.height - 0.5);
    },
    [noTilt, rawX, rawY]
  );

  const tiltStyle: MotionStyle = noTilt
    ? {}
    : { rotateX: rotX, rotateY: rotY, translateZ: z, transformStyle: "preserve-3d" };

  const defaultFill = dark
    ? (fillOpacity ?? 0.52)
    : (fillOpacity ?? 0.72);

  const cardBg = dark
    ? `rgba(10,8,24,${defaultFill})`
    : `rgba(255,255,255,${defaultFill})`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => {
        if (levitate) z.set(28);
        glowOpacity.set(1);
      }}
      onMouseLeave={() => {
        rawX.set(0); rawY.set(0);
        z.set(0);   glowOpacity.set(0);
      }}
      onClick={onClick}
      style={{
        perspective: 1200,
        ...tiltStyle,
        ...style,
        position: "relative",
      }}
      className={cn("relative", className)}
    >
      {/* Chromatic glow border on hover */}
      <motion.div
        style={{
          opacity:  glowOpacity,
          position: "absolute",
          inset:    -1,
          borderRadius: "inherit",
          background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary), var(--tc-accent))",
          zIndex:   0,
          filter:   "blur(1.5px)",
        }}
        aria-hidden
      />

      {/* Glass face — all 3 layers */}
      <div
        style={{
          position:        "relative",
          zIndex:          1,
          background:      cardBg,
          border:          `1px solid ${dark ? EDGE.dark.border : EDGE.light.border}`,
          backdropFilter:  "blur(40px) saturate(200%) brightness(1.06)",
          WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.06)",
          boxShadow:       edgeShadow(dark),
          borderRadius:    "inherit",
          height:          "100%",
          overflow:        "hidden",
        }}
      >
        {/* Specular top-sheen gradient (simulates curved glass lens) */}
        <div
          aria-hidden
          style={{
            position:   "absolute",
            top: 0, left: 0, right: 0,
            height:     "40%",
            background: dark
              ? "linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, transparent 100%)"
              : "linear-gradient(to bottom, rgba(255,255,255,0.72) 0%, transparent 100%)",
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GlassPanel — static glass surface (sidebar, header, dropdown)
───────────────────────────────────────────────────────────────────────────── */
export interface GlassPanelProps {
  children:   React.ReactNode;
  className?: string;
  style?:     React.CSSProperties;
  intensity?: "light" | "medium" | "strong" | "ultra";
}

export function GlassPanel({
  children,
  className,
  style,
  intensity = "medium",
}: GlassPanelProps) {
  const { dark } = useTheme();

  const blurMap = {
    light:  "blur(20px)  saturate(180%) brightness(1.04)",
    medium: "blur(40px)  saturate(200%) brightness(1.06)",
    strong: "blur(64px)  saturate(220%) brightness(1.08)",
    ultra:  "blur(100px) saturate(240%) brightness(1.10)",
  };
  const bgDark  = {
    light:  "rgba(10,8,24,0.52)",
    medium: "rgba(10,8,24,0.68)",
    strong: "rgba(8,6,20,0.80)",
    ultra:  "rgba(6,4,16,0.90)",
  };
  const bgLight = {
    light:  "rgba(255,255,255,0.52)",
    medium: "rgba(255,255,255,0.68)",
    strong: "rgba(255,255,255,0.82)",
    ultra:  "rgba(255,255,255,0.94)",
  };

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background:              dark ? bgDark[intensity] : bgLight[intensity],
        backdropFilter:          blurMap[intensity],
        WebkitBackdropFilter:    blurMap[intensity],
        border:                  `1px solid ${dark ? EDGE.dark.border : EDGE.light.border}`,
        boxShadow:               edgeShadow(dark),
        ...style,
      }}
    >
      {/* Top sheen */}
      <div
        aria-hidden
        style={{
          position:   "absolute",
          top: 0, left: 0, right: 0,
          height:     "30%",
          background: dark
            ? "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)"
            : "linear-gradient(to bottom, rgba(255,255,255,0.80) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GlassSheet — modal / bottom-sheet container
───────────────────────────────────────────────────────────────────────────── */
export interface GlassSheetProps {
  children:   React.ReactNode;
  className?: string;
  style?:     React.CSSProperties;
}

export function GlassSheet({ children, className, style }: GlassSheetProps) {
  const { dark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1.00 }}
      exit={{    opacity: 0, y: 16, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn("relative overflow-hidden", className)}
      style={{
        background:           dark ? "rgba(8,6,20,0.88)"    : "rgba(255,255,255,0.90)",
        backdropFilter:       "blur(100px) saturate(240%) brightness(1.10)",
        WebkitBackdropFilter: "blur(100px) saturate(240%) brightness(1.10)",
        border:               `1px solid ${dark ? EDGE.dark.border : EDGE.light.border}`,
        boxShadow:            edgeShadow(dark),
        borderRadius:         "var(--radius-xl)",
        ...style,
      }}
    >
      {/* Drag handle indicator */}
      <div style={{
        width: 36, height: 4,
        borderRadius: 99,
        background: dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)",
        margin: "12px auto 0",
      }} />
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FloatingCube — animated decorative 3D cube
───────────────────────────────────────────────────────────────────────────── */
export interface FloatingCubeProps {
  size?:     number;
  x:         string;
  y:         string;
  color:     string;
  delay?:    number;
  duration?: number;
}

export function FloatingCube({
  size = 40, x, y, color, delay = 0, duration = 7,
}: FloatingCubeProps) {
  const c14 = `color-mix(in srgb, ${color} 14%, transparent)`;
  const c28 = `color-mix(in srgb, ${color} 28%, transparent)`;
  const c08 = `color-mix(in srgb, ${color}  8%, transparent)`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ delay, duration: 1.6 }}
      style={{ position: "absolute", left: x, top: y, width: size, height: size, perspective: 600 }}
    >
      <motion.div
        animate={{
          rotateX: [0, 28, 0, -18, 0],
          rotateY: [0, 38, 12, -22, 0],
          y:       [0, -16, -7, -20, 0],
        }}
        transition={{
          duration: duration + delay * 2,
          repeat:   Infinity,
          ease:     "easeInOut",
          delay,
        }}
        style={{
          width:        size,
          height:       size,
          borderRadius: size * 0.20,
          /* 3-layer glass cube face */
          background: `linear-gradient(135deg, ${c14} 0%, ${c28} 100%)`,
          border:     `1px solid ${c28}`,
          boxShadow: [
            `inset 0 1px 0 rgba(255,255,255,0.14)`,
            `inset 0 -1px 0 rgba(0,0,0,0.12)`,
            `0 0 24px ${c08}`,
            `0 8px 24px ${c08}`,
          ].join(", "),
          backdropFilter:       "blur(8px) saturate(140%)",
          WebkitBackdropFilter: "blur(8px) saturate(140%)",
          transformStyle:       "preserve-3d",
        }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SceneBackground — full-screen animated background
───────────────────────────────────────────────────────────────────────────── */
export interface SceneBackgroundProps {
  cubeCount?: number;
  showGrid?:  boolean;
  zIndex?:    number;
}

export function SceneBackground({
  cubeCount = 6,
  showGrid  = true,
  zIndex    = 0,
}: SceneBackgroundProps) {
  const { dark } = useTheme();

  // ── Hydration guard ──────────────────────────────────────────────────────
  // SceneBackground uses browser-only animations. Returning null on the
  // server prevents the "Unsupported Server Component type: undefined" crash
  // and the React hydration mismatch error.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  // ────────────────────────────────────────────────────────────────────────

  const cubeConfigs = [
    { size: 56, x: "7%",  y: "14%", color: "var(--tc-primary)",   delay: 0.2, duration: 9  },
    { size: 30, x: "82%", y: "8%",  color: "var(--tc-secondary)", delay: 0.6, duration: 7  },
    { size: 66, x: "85%", y: "55%", color: "var(--tc-accent)",    delay: 0.4, duration: 11 },
    { size: 38, x: "3%",  y: "68%", color: "var(--tc-secondary)", delay: 0.9, duration: 8  },
    { size: 22, x: "60%", y: "82%", color: "var(--tc-primary)",   delay: 1.1, duration: 6  },
    { size: 48, x: "42%", y: "6%",  color: "var(--tc-accent)",    delay: 1.3, duration: 10 },
    { size: 28, x: "28%", y: "45%", color: "var(--tc-primary)",   delay: 0.7, duration: 9  },
    { size: 42, x: "70%", y: "30%", color: "var(--tc-secondary)", delay: 1.5, duration: 8  },
  ].slice(0, cubeCount);

  return (
    <>
      {/* Ambient orb layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex }}>
        {/* Primary orb — large, top-left */}
        <div
          className="orb-1 absolute rounded-full gpu"
          style={{
            left: "5%", top: "5%",
            width: "55vw", height: "55vw",
            background: "radial-gradient(circle, color-mix(in srgb, var(--tc-primary) 18%, transparent) 0%, transparent 70%)",
            filter: "blur(72px)",
            opacity: dark ? 1 : 0.55,
          }}
        />
        {/* Secondary orb — mid-right */}
        <div
          className="orb-2 absolute rounded-full gpu"
          style={{
            left: "55%", top: "48%",
            width: "44vw", height: "44vw",
            background: "radial-gradient(circle, color-mix(in srgb, var(--tc-secondary) 14%, transparent) 0%, transparent 70%)",
            filter: "blur(64px)",
            opacity: dark ? 1 : 0.45,
          }}
        />
        {/* Accent orb — top-right */}
        <div
          className="orb-3 absolute rounded-full gpu"
          style={{
            left: "68%", top: "8%",
            width: "32vw", height: "32vw",
            background: "radial-gradient(circle, color-mix(in srgb, var(--tc-accent) 12%, transparent) 0%, transparent 70%)",
            filter: "blur(56px)",
            opacity: dark ? 1 : 0.40,
          }}
        />
        {/* Bottom fill orb */}
        <div
          className="orb-4 absolute rounded-full gpu"
          style={{
            left: "20%", bottom: "0%",
            width: "40vw", height: "36vw",
            background: "radial-gradient(circle, color-mix(in srgb, var(--tc-secondary) 10%, transparent) 0%, transparent 70%)",
            filter: "blur(80px)",
            opacity: dark ? 0.7 : 0.30,
          }}
        />
      </div>

      {/* Dot-grid overlay */}
      {showGrid && (
        <div
          className="fixed inset-0 pointer-events-none dot-grid"
          style={{ zIndex, opacity: dark ? 0.11 : 0.06 }}
        />
      )}

      {/* Floating decorative cubes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex }}>
        {cubeConfigs.map((c, i) => (
          <FloatingCube key={i} {...c} />
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GlassButton — spring-physics iOS-style button
───────────────────────────────────────────────────────────────────────────── */
export interface GlassButtonProps {
  children:  React.ReactNode;
  onClick?:  () => void;
  variant?:  "primary" | "ghost" | "outline" | "danger";
  size?:     "xs" | "sm" | "md" | "lg";
  className?: string;
  type?:     "button" | "submit" | "reset";
  disabled?: boolean;
  loading?:  boolean;
  icon?:     React.ReactNode;
}

export function GlassButton({
  children,
  onClick,
  variant  = "primary",
  size     = "md",
  className,
  type     = "button",
  disabled = false,
  loading  = false,
  icon,
}: GlassButtonProps) {
  const { dark } = useTheme();

  const sizeMap = {
    xs: "px-3  py-1.5 text-[11px] rounded-[10px] gap-1.5",
    sm: "px-4  py-2   text-xs     rounded-[12px] gap-2",
    md: "px-6  py-2.5 text-sm     rounded-[14px] gap-2",
    lg: "px-8  py-4   text-sm     rounded-[16px] gap-2.5",
  };

  const variantStyle: React.CSSProperties = (() => {
    switch (variant) {
      case "primary":
        return {
          background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.25)",
            "inset 0 -1px 0 rgba(0,0,0,0.14)",
            "0 6px 24px color-mix(in srgb, var(--tc-primary) 40%, transparent)",
            "0 2px 8px  color-mix(in srgb, var(--tc-primary) 20%, transparent)",
          ].join(", "),
          color: "#fff",
        };
      case "ghost":
        return {
          background: "color-mix(in srgb, var(--tc-primary) 10%, transparent)",
          border:     "1px solid color-mix(in srgb, var(--tc-primary) 22%, transparent)",
          boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.10)",
          color:      "var(--tc-primary)",
        };
      case "outline":
        return {
          background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.60)",
          border:     "1px solid color-mix(in srgb, var(--tc-primary) 35%, transparent)",
          boxShadow:  `inset 0 1px 0 rgba(255,255,255,${dark ? "0.08" : "0.80"})`,
          color:      "var(--tc-primary)",
        };
      case "danger":
        return {
          background: "rgba(239,68,68,0.12)",
          border:     "1px solid rgba(239,68,68,0.30)",
          boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.06)",
          color:      "#f87171",
        };
    }
  })();

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      /* Apple spring physics */
      whileHover={!(disabled || loading) ? { scale: 1.025, y: -1 } : {}}
      whileTap={!(disabled || loading)   ? { scale: 0.96  } : {}}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn(
        "relative font-semibold flex items-center justify-center leading-none",
        "transition-opacity duration-200",
        sizeMap[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      style={variantStyle}
    >
      {loading && (
        <svg
          className="w-3.5 h-3.5 shrink-0"
          viewBox="0 0 24 24" fill="none"
          style={{ animation: "spin 0.75s linear infinite" }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && icon && <span className="shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GlassBadge — status pill badge
───────────────────────────────────────────────────────────────────────────── */
export interface GlassBadgeProps {
  children:   React.ReactNode;
  color?:     string;
  pulse?:     boolean;
  className?: string;
  size?:      "xs" | "sm" | "md";
}

export function GlassBadge({
  children,
  color    = "var(--tc-primary)",
  pulse    = false,
  className,
  size     = "sm",
}: GlassBadgeProps) {
  const sizeMap = {
    xs: "px-2 py-0.5 text-[9px]  rounded-[6px]",
    sm: "px-2.5 py-1 text-[10px] rounded-[8px]",
    md: "px-3 py-1.5 text-xs     rounded-[10px]",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-bold", sizeMap[size], className)}
      style={{
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        color,
        border:     `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        boxShadow:  `inset 0 1px 0 rgba(255,255,255,0.10)`,
      }}
    >
      {pulse && (
        <span
          className="rounded-full shrink-0"
          style={{
            width: 6, height: 6,
            background:  color,
            animation:   "pulse 2.4s ease-in-out infinite",
            boxShadow:   `0 0 6px ${color}88`,
          }}
        />
      )}
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GlassDivider — glass-tinted horizontal rule
───────────────────────────────────────────────────────────────────────────── */
export function GlassDivider({ className }: { className?: string }) {
  const { dark } = useTheme();
  return (
    <div
      className={cn("w-full h-px", className)}
      style={{
        background: dark
          ? "linear-gradient(to right, transparent, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.10) 70%, transparent)"
          : "linear-gradient(to right, transparent, rgba(0,0,0,0.07) 30%, rgba(0,0,0,0.07) 70%, transparent)",
      }}
    />
  );
}