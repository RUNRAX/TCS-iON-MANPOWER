"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

const FireBackground = memo(function FireBackground() {
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
    let w = 0, h = 0;
    let lastTime = 0;

    const isMobile = window.innerWidth <= 768;
    const FRAME_MS = isMobile ? (1000 / 20) : (1000 / 40);
    const PARTICLE_COUNT = isMobile ? 80 : 250;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      life: number;
      maxLife: number;
      rgb: string;

      constructor(w: number, h: number, rgbBase: string, rgbAccent: string) {
        this.x = Math.random() * w;
        // Spawns near or slightly below the bottom edge
        this.y = h + Math.random() * 50; 
        
        // Horizontal drift
        this.vx = (Math.random() - 0.5) * 1.5;
        // Float upwards
        this.vy = -Math.random() * (isMobile ? 2.5 : 3.5) - 1;
        
        this.radius = Math.random() * 6 + 2;
        this.life = 0;
        this.maxLife = Math.random() * 80 + 40;
        
        // Randomly assign pure base or accent color to give depth
        this.rgb = Math.random() > 0.6 ? rgbAccent : rgbBase;
      }
    }

    let particles: Particle[] = [];

    const resolveToRgb = (color: string): string => {
      try {
        if (color.startsWith("var(")) {
          const varName = color.slice(4, -1).trim();
          const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
          if (!computed) return "239,68,68";
          return resolveToRgb(computed);
        }
        if (color.startsWith("#")) {
          let hex = color;
          if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          if (isNaN(r)) return "239,68,68";
          return `${r},${g},${b}`;
        }
        const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (rgbMatch) return `${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]}`;
        return "239,68,68";
      } catch {
        return "239,68,68";
      }
    };

    const rgbBase = resolveToRgb(theme.primary);
    const rgbAccent = resolveToRgb(theme.accent);

    const resize = () => { 
      w = canvas.width = canvas.offsetWidth; 
      h = canvas.height = canvas.offsetHeight; 
      particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle(w, h, rgbBase, rgbAccent));
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - lastTime < FRAME_MS) return;
      lastTime = now;
      ctx.clearRect(0, 0, w, h);

      // Deep glowing background gradients to emphasize the heat
      [
        { cx: 0.5, cy: 1.1, size: 0.8, rgb: rgbBase, alpha: dark ? 0.35 : 0.15 },
        { cx: 0.2, cy: 0.9, size: 0.6, rgb: rgbAccent, alpha: dark ? 0.2 : 0.1 },
        { cx: 0.8, cy: 0.9, size: 0.6, rgb: resolveToRgb(theme.secondary), alpha: dark ? 0.2 : 0.1 },
      ].forEach(o => {
        const g = ctx.createRadialGradient(o.cx * w, o.cy * h, 0, o.cx * w, o.cy * h, o.size * Math.max(w, h));
        g.addColorStop(0, `rgba(${o.rgb},${o.alpha})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      // Update & Draw particles
      ctx.globalCompositeOperation = dark ? "screen" : "multiply";
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Give them a slight erratic wave motion
        p.vx += (Math.random() - 0.5) * 0.2;
        
        const lifeRatio = p.life / p.maxLife;
        // Particle shrinks as it goes up
        const r = Math.max(0.1, p.radius * (1 - lifeRatio));
        // Alpha fades as it reaches max life
        const alpha = Math.max(0, (1 - lifeRatio) * (dark ? 0.8 : 0.6));

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.rgb},${alpha})`;
        ctx.fill();

        // Respawn if dead
        if (p.life >= p.maxLife || p.y < -50) {
          particles[i] = new Particle(w, h, rgbBase, rgbAccent);
        }
      }
      ctx.globalCompositeOperation = "source-over"; // reset
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
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

export default FireBackground;
