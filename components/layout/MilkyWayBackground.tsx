"use client";
import React, { useEffect, useRef } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

/**
 * Highly realistic, parallax-enabled Milky Way canvas background.
 * Theme-aware (adds very subtle tint over the stars based on theme).
 * Positioned absolutely (fixed) so it won't scroll with content.
 */
export default function MilkyWayBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, dark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // We will generate stars once
    interface Star {
      x: number;
      y: number;
      z: number; // For parallax / size
      size: number;
      twinkleSpeed: number;
      twinklePhase: number;
      color: string;
    }
    
    let stars: Star[] = [];

    const initStars = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const starCount = Math.floor((width * height) / 1200); // Dense starfield
      stars = [];

      for (let i = 0; i < starCount; i++) {
        // Milky way distribution: concentrate more stars near the diagonal center
        const isCore = Math.random() > 0.6;
        let x = Math.random() * width;
        let y = Math.random() * height;

        // Bias towards a diagonal line (y = x)
        if (isCore) {
          const spread = (Math.random() - 0.5) * (width * 0.4);
          const posOnLine = Math.random();
          x = posOnLine * width + spread * 0.5;
          y = posOnLine * height - spread;
        }

        const size = Math.pow(Math.random(), 3) * 2 + 0.5; // Mostly small, occasional large
        
        // Slight color variation
        const cRand = Math.random();
        let color = "#ffffff";
        if (cRand > 0.9) color = "#b8c5f9"; // Blueish
        else if (cRand > 0.8) color = "#ffd2a1"; // Reddish/Orange

        stars.push({
          x,
          y,
          z: Math.random() * 0.5 + 0.1, // Parallax depth
          size,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
        });
      }
    };

    initStars();

    window.addEventListener("resize", initStars);

    // Parallax mouse effect
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - width / 2) * 0.05;
      targetMouseY = (e.clientY - height / 2) * 0.05;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Base space color
      ctx.fillStyle = dark ? "#020108" : "#0a0b10";
      ctx.fillRect(0, 0, width, height);

      // Render Milky Way Dust / Nebula
      // To make it performant, we draw a few large radial gradients
      const gradient1 = ctx.createRadialGradient(
        width * 0.4 - mouseX * 2, height * 0.4 - mouseY * 2, 0,
        width * 0.4 - mouseX * 2, height * 0.4 - mouseY * 2, width * 0.8
      );
      
      // Use CSS variables for theme-aware nebula tint
      const primaryRgb   = getComputedStyle(document.documentElement).getPropertyValue("--tc-primary-rgb").trim() || "138, 43, 226"; 
      const secondaryRgb = getComputedStyle(document.documentElement).getPropertyValue("--tc-secondary-rgb").trim() || "75, 0, 130";

      gradient1.addColorStop(0, dark ? `rgba(${primaryRgb}, 0.08)` : `rgba(255,255,255,0.05)`);
      gradient1.addColorStop(0.5, dark ? `rgba(${secondaryRgb}, 0.03)` : `rgba(255,255,255,0.02)`);
      gradient1.addColorStop(1, "transparent");

      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, width, height);

      const time = Date.now();

      // Render stars
      for (const star of stars) {
        // Parallax shift
        const px = star.x + mouseX * star.z;
        const py = star.y + mouseY * star.z;

        // Twinkle
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        const opacity = Math.max(0.2, (twinkle + 1) / 2); // 0.2 to 1.0

        ctx.globalAlpha = opacity;
        ctx.fillStyle = star.color;

        ctx.beginPath();
        // Render circles for larger stars, rects for very small (performance)
        if (star.size > 1.2) {
            ctx.arc(px, py, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add slight glow to bigger stars
            ctx.globalAlpha = opacity * 0.3;
            ctx.beginPath();
            ctx.arc(px, py, star.size * 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(px, py, star.size, star.size);
        }
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", initStars);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [dark, theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0, 
        pointerEvents: "none",
        background: "#000",
      }}
    />
  );
}
