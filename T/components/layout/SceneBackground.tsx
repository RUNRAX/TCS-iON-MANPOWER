"use client";

import React, { useEffect, useRef, memo, useState } from "react";

const SceneBackground = memo(function SceneBackground({
  t, dark,
}: { t: { primary: string; secondary: string; accent: string }; dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Hydration guard ──────────────────────────────────────────────────────
  // <canvas> cannot be server-rendered. Returning null on the first render
  // ensures the server HTML and the initial client render match, preventing
  // the "Expected server HTML to contain a matching <canvas>" error.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.transform = "translateZ(0)";
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let raf: number;
    let w = 0, h = 0;
    let lastTime = 0;
    const FRAME_MS = 1000 / 30;

    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00016,
      vy: (Math.random() - 0.5) * 0.00016,
      r: Math.random() * 1.6 + 0.4,
      opacity: Math.random() * 0.45 + 0.12,
    }));

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r},${g},${b}`;
    };

    const rgbP = hexToRgb(t.primary);
    const rgbS = hexToRgb(t.secondary);
    const rgbA = hexToRgb(t.accent);

    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - lastTime < FRAME_MS) return;
      lastTime = now;
      ctx.clearRect(0, 0, w, h);

      [
        { cx: 0.15, cy: 0.2,  size: 0.45, rgb: rgbP },
        { cx: 0.75, cy: 0.65, size: 0.35, rgb: rgbS },
        { cx: 0.85, cy: 0.15, size: 0.25, rgb: rgbA },
      ].forEach(o => {
        const g = ctx.createRadialGradient(o.cx * w, o.cy * h, 0, o.cx * w, o.cy * h, o.size * Math.max(w, h));
        g.addColorStop(0, `rgba(${o.rgb},${dark ? 0.13 : 0.09})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = (particles[i].x - particles[j].x) * w;
          const dy = (particles[i].y - particles[j].y) * h;
          const d2 = dx * dx + dy * dy;
          if (d2 < 160 * 160) {
            const dist = Math.sqrt(d2);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${rgbP},${(1 - dist / 160) * (dark ? 0.11 : 0.06)})`;
            ctx.moveTo(particles[i].x * w, particles[i].y * h);
            ctx.lineTo(particles[j].x * w, particles[j].y * h);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbP},${p.opacity * (dark ? 0.65 : 0.38)})`;
        ctx.fill();
      });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [t, dark, mounted]);

  // Return nothing until client has mounted — keeps server/client HTML in sync
  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, willChange: "transform" }}
    />
  );
});

export default SceneBackground;