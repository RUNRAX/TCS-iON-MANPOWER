"use client";
/**
 * NavigationProgress.tsx
 * Buttery-smooth top progress bar driven entirely by CSS animations.
 * - Uses CSS @keyframes, not setTimeout intervals → no jitter
 * - Completes instantly when pathname changes (page is ready)
 * - Theme-reactive gradient via useTheme
 */
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/context/ThemeContext";

type BarState = "idle" | "loading" | "completing" | "done";

export default function NavigationProgress() {
  const pathname  = usePathname();
  const { theme: t } = useTheme();
  const [state, setState] = useState<BarState>("idle");
  const prevPath  = useRef(pathname);
  const timers    = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    clear();
    // Start the "indeterminate" crawl
    setState("loading");

    // After a short delay, complete it (page is usually ready by now)
    const t1 = setTimeout(() => {
      setState("completing");
      const t2 = setTimeout(() => setState("done"), 320);
      const t3 = setTimeout(() => setState("idle"), 700);
      timers.current.push(t2, t3);
    }, 80);

    timers.current.push(t1);
    return clear;
  }, [pathname]);

  if (state === "idle") return null;

  const grad = `linear-gradient(to right, var(--tc-primary), var(--tc-secondary), var(--tc-accent), var(--tc-primary))`;

  return (
    <>
      <style>{`
        @keyframes nprogress-slide {
          0%   { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes nprogress-enter {
          from { transform: scaleX(0); opacity: 1; }
          to   { transform: scaleX(0.85); opacity: 1; }
        }
        @keyframes nprogress-complete {
          from { transform: scaleX(0.85); }
          to   { transform: scaleX(1); }
        }
        @keyframes nprogress-fade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position:        "fixed",
          top:             0,
          left:            0,
          right:           0,
          height:          3,
          zIndex:          99999,
          transformOrigin: "left center",
          backgroundImage: grad,
          backgroundSize:  "200% 100%",
          boxShadow:       `0 0 10px var(--tc-primary), 0 0 4px color-mix(in srgb, var(--tc-primary) 33%, transparent)`,
          borderRadius:    "0 3px 3px 0",
          pointerEvents:   "none",
          // Drive animation purely by state — no timers for visual updates
          animation:
            state === "loading"
              ? `nprogress-enter 2s cubic-bezier(0.1, 0.4, 0.1, 1) forwards,
                 nprogress-slide 1.5s linear infinite`
              : state === "completing"
              ? `nprogress-complete 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards,
                 nprogress-slide 1.5s linear infinite`
              : `nprogress-fade 0.3s ease forwards`,
          transform: state === "loading" ? undefined : state === "done" ? "scaleX(1)" : undefined,
        }}
      />
    </>
  );
}
