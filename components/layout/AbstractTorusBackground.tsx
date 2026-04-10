"use client";
import React, { useEffect, useRef } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

/**
 * AbstractTorusBackground — GPU-accelerated canvas with
 * metallic 3D toroidal shapes rendered via layered gradients.
 * Theme-aware: primary/secondary/accent drive the glow colors.
 * Fixed position so it never scrolls with content.
 */
export default function AbstractTorusBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { dark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf: number;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    // Read theme CSS vars once per frame for reactivity
    const getColor = (varName: string, fallback: string) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return v || fallback;
    };

    // Torus ring definition
    interface Torus {
      cx: number; cy: number;
      rx: number; ry: number;
      rotation: number;    // radians
      rotSpeed: number;
      thickness: number;
      colorVar: string;
      fallbackColor: string;
      opacity: number;
    }

    const toruses: Torus[] = [
      { cx: 0.45, cy: 0.4, rx: 0.35, ry: 0.18, rotation: 0, rotSpeed: 0.0004, thickness: 0.06, colorVar: "--tc-primary", fallbackColor: "#8b5cf6", opacity: 0.5 },
      { cx: 0.55, cy: 0.55, rx: 0.28, ry: 0.22, rotation: 1.2, rotSpeed: -0.0003, thickness: 0.05, colorVar: "--tc-secondary", fallbackColor: "#6366f1", opacity: 0.4 },
      { cx: 0.5, cy: 0.48, rx: 0.42, ry: 0.14, rotation: 2.4, rotSpeed: 0.0005, thickness: 0.07, colorVar: "--tc-accent", fallbackColor: "#a855f7", opacity: 0.35 },
      { cx: 0.4, cy: 0.6, rx: 0.2, ry: 0.25, rotation: 0.8, rotSpeed: -0.0006, thickness: 0.04, colorVar: "--tc-primary", fallbackColor: "#8b5cf6", opacity: 0.3 },
      { cx: 0.6, cy: 0.35, rx: 0.3, ry: 0.12, rotation: 3.8, rotSpeed: 0.00035, thickness: 0.05, colorVar: "--tc-secondary", fallbackColor: "#6366f1", opacity: 0.25 },
    ];

    // Draw a single elliptical ring with metallic shading
    const drawTorus = (t: Torus, time: number) => {
      const cx = t.cx * w;
      const cy = t.cy * h;
      const rx = t.rx * Math.min(w, h);
      const ry = t.ry * Math.min(w, h);
      const thickness = t.thickness * Math.min(w, h);
      const rot = t.rotation + time * t.rotSpeed;
      const color = getColor(t.colorVar, t.fallbackColor);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      // Outer glow
      const glowGrad = ctx.createRadialGradient(0, 0, rx * 0.6, 0, 0, rx * 1.3);
      glowGrad.addColorStop(0, `color-mix(in srgb, ${color} 8%, transparent)`);
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(-rx * 1.5, -ry * 1.5, rx * 3, ry * 3);

      // Draw the ring as many small arcs with varying brightness
      const segments = 64;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const nextAngle = ((i + 1) / segments) * Math.PI * 2;

        // Simulate 3D lighting — brighter on top, darker at bottom
        const lightFactor = 0.4 + 0.6 * (Math.sin(angle + rot * 2) * 0.5 + 0.5);
        const alpha = t.opacity * lightFactor;

        const x1 = Math.cos(angle) * rx;
        const y1 = Math.sin(angle) * ry;
        const x2 = Math.cos(nextAngle) * rx;
        const y2 = Math.sin(nextAngle) * ry;

        // Inner highlight (metallic sheen)
        const sheenOffset = Math.sin(angle * 2 + time * 0.001) * thickness * 0.3;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = thickness + sheenOffset;
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineCap = "round";
        ctx.stroke();

        // Inner bright highlight on "top" of tube
        if (lightFactor > 0.7) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = thickness * 0.3;
          ctx.strokeStyle = dark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)";
          ctx.globalAlpha = alpha * 0.5;
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const render = () => {
      const time = performance.now();

      // Dark background
      ctx.fillStyle = dark ? "#030210" : "#0d0b1a";
      ctx.fillRect(0, 0, w, h);

      // Center glow (subtle)
      const centerGlow = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.min(w, h) * 0.5);
      const primaryColor = getColor("--tc-primary", "#8b5cf6");
      centerGlow.addColorStop(0, `color-mix(in srgb, ${primaryColor} 6%, transparent)`);
      centerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, w, h);

      // Draw toruses
      for (const t of toruses) {
        drawTorus(t, time);
      }

      // Subtle vignette
      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.3, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
