"use client";
/**
 * components/layout/OrbitalRingsBackground.tsx
 *
 * Cinematic animated concentric rings/arcs with glowing trail effects.
 * Colors adapt to the active ThemeContext palette in real-time.
 * GPU-accelerated canvas, mobile-optimized, respects reduced motion.
 */

import React, { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

/* ── Helper: resolve any CSS color to "r,g,b" string ────────────────────── */
function resolveToRgb(color: string): string {
  try {
    if (color.startsWith("var(")) {
      const varName = color.slice(4, -1).trim();
      const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return val ? resolveToRgb(val) : "100,180,255";
    }
    if (color.startsWith("#")) {
      let hex = color;
      if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return isNaN(r) ? "100,180,255" : `${r},${g},${b}`;
    }
    const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? `${m[1]},${m[2]},${m[3]}` : "100,180,255";
  } catch {
    return "100,180,255";
  }
}

/* ── Ring data ───────────────────────────────────────────────────────────── */
interface Ring {
  radius: number;
  speed: number;
  offset: number;
  arcLen: number;
  lineW: number;
  rgb: string;
  glow: number;
  baseAlpha: number;
}

const OrbitalRingsBackground = memo(function OrbitalRingsBackground() {
  const { theme, dark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.transform = "translateZ(0)";
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let raf: number;
    let w = 0;
    let h = 0;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth <= 768;
    const FPS = isMobile ? 30 : 60;
    const FRAME_MS = 1000 / FPS;
    const RING_COUNT = isMobile ? 8 : 14;
    const SEGMENTS = isMobile ? 10 : 16;

    const rgbPrimary = resolveToRgb(theme.primary);
    const rgbSecondary = resolveToRgb(theme.secondary);
    const rgbAccent = resolveToRgb(theme.accent);
    const palette = [rgbPrimary, rgbSecondary, rgbAccent];

    let rings: Ring[] = [];

    const buildRings = () => {
      const minR = Math.min(w, h) * 0.10;
      const maxR = Math.max(w, h) * 0.72;
      rings = Array.from({ length: RING_COUNT }, (_, i) => {
        const t = i / (RING_COUNT - 1);
        return {
          radius: minR + t * (maxR - minR),
          speed: (0.10 + Math.random() * 0.30) * (i % 2 === 0 ? 1 : -1) * (prefersReduced ? 0.15 : 1),
          offset: Math.random() * Math.PI * 2,
          arcLen: Math.PI * (0.35 + Math.random() * 0.9),
          lineW: 1.0 + Math.random() * 2.0,
          rgb: palette[i % 3],
          glow: 5 + Math.random() * 12,
          baseAlpha: 0.20 + Math.random() * 0.40,
        };
      });
    };

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      buildRings();
    };

    let time = 0;
    let lastFrame = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;

      ctx.clearRect(0, 0, w, h);
      time += 0.005;

      // Origin — bottom-left area
      const cx = w * 0.10;
      const cy = h * 1.02;

      // ── Ambient glow at the origin point ──
      const glow1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
      glow1.addColorStop(0, `rgba(${rgbPrimary},${dark ? 0.14 : 0.07})`);
      glow1.addColorStop(0.3, `rgba(${rgbSecondary},${dark ? 0.06 : 0.03})`);
      glow1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, w, h);

      // ── Secondary glow — top-right for depth ──
      const glow2 = ctx.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, Math.max(w, h) * 0.35);
      glow2.addColorStop(0, `rgba(${rgbAccent},${dark ? 0.06 : 0.03})`);
      glow2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      // ── Draw each ring ──
      for (const ring of rings) {
        const angle = time * ring.speed + ring.offset;

        ctx.save();
        ctx.translate(cx, cy);
        // Elliptical — wider than tall, matching reference perspective
        ctx.scale(1.7, 0.55);

        // Outer glow layer
        ctx.beginPath();
        ctx.arc(0, 0, ring.radius, angle, angle + ring.arcLen);
        ctx.strokeStyle = `rgba(${ring.rgb},${ring.baseAlpha * (dark ? 0.20 : 0.10)})`;
        ctx.lineWidth = ring.lineW + ring.glow;
        ctx.lineCap = "round";
        ctx.stroke();

        // ── Fading trail — multiple segments with decreasing opacity ──
        for (let s = 0; s < SEGMENTS; s++) {
          const t = s / SEGMENTS;
          const segStart = angle + ring.arcLen * t;
          const segEnd = angle + ring.arcLen * (t + 1 / SEGMENTS) + 0.008;
          const alpha = ring.baseAlpha * (1 - t * 0.88) * (dark ? 0.70 : 0.40);

          ctx.beginPath();
          ctx.arc(0, 0, ring.radius, segStart, segEnd);
          ctx.strokeStyle = `rgba(${ring.rgb},${alpha.toFixed(3)})`;
          ctx.lineWidth = ring.lineW * (1 - t * 0.25);
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // ── Bright head dot with glow ──
        const hx = Math.cos(angle) * ring.radius;
        const hy = Math.sin(angle) * ring.radius;

        // Head bloom
        const headGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, ring.lineW * 6);
        headGlow.addColorStop(0, `rgba(${ring.rgb},${ring.baseAlpha * (dark ? 0.55 : 0.30)})`);
        headGlow.addColorStop(1, `rgba(${ring.rgb},0)`);
        ctx.beginPath();
        ctx.arc(hx, hy, ring.lineW * 6, 0, Math.PI * 2);
        ctx.fillStyle = headGlow;
        ctx.fill();

        // Solid bright head
        ctx.beginPath();
        ctx.arc(hx, hy, ring.lineW * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ring.rgb},${Math.min(1, ring.baseAlpha * (dark ? 1.3 : 0.9))})`;
        ctx.fill();

        ctx.restore();
      }

      // ── Subtle pulsing center bloom (breathe effect) ──
      const pulse = Math.sin(time * 3) * 0.03 + 0.07;
      const centerBloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.25);
      centerBloom.addColorStop(0, `rgba(${rgbPrimary},${pulse * (dark ? 1 : 0.5)})`);
      centerBloom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = centerBloom;
      ctx.fillRect(0, 0, w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [theme, dark, mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, willChange: "transform" }}
    />
  );
});

export default OrbitalRingsBackground;
