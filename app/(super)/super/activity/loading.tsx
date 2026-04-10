"use client";
/**
 * app/(super)/super/activity/loading.tsx — Activity monitor skeleton
 */

import { useTheme } from "@/lib/context/ThemeContext";

function Shimmer({ width, height, radius = 12, dark }: { width?: string | number; height: string | number; radius?: number; dark: boolean }) {
  return (
    <div style={{
      width: width ?? "100%", height, borderRadius: radius,
      background: dark
        ? "linear-gradient(90deg, rgba(10,30,80,0.4) 25%, rgba(26,111,255,0.12) 50%, rgba(10,30,80,0.4) 75%)"
        : "linear-gradient(90deg, rgba(200,220,255,0.4) 25%, rgba(100,180,255,0.2) 50%, rgba(200,220,255,0.4) 75%)",
      backgroundSize: "400px 100%", animation: "shimmer 1.4s ease infinite",
    }} />
  );
}

export default function SuperActivityLoading() {
  const { dark } = useTheme();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(100,180,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,180,255,0.08) 1px, transparent 1px)`,
        backgroundSize: "40px 40px", opacity: 0.06,
      }} />
      <div style={{ position: "relative", zIndex: 1, padding: "32px 28px 48px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Shimmer width={240} height={24} radius={8} dark={dark} />
          <div style={{ marginTop: 8 }}><Shimmer width={300} height={14} radius={6} dark={dark} /></div>
        </div>
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <Shimmer width={200} height={36} radius={10} dark={dark} />
          <Shimmer width={36} height={36} radius={8} dark={dark} />
          <div style={{ marginLeft: "auto" }}><Shimmer width={100} height={14} radius={4} dark={dark} /></div>
        </div>
        {/* Log entries */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 18px", borderRadius: 14,
              borderLeft: "3px solid var(--tc-primary)",
              border: "var(--spatial-glass-border)", borderLeftWidth: 3,
            }}>
              <Shimmer width={130} height={14} radius={4} dark={dark} />
              <Shimmer width={70} height={22} radius={6} dark={dark} />
              <div style={{ flex: 1 }}><Shimmer height={14} radius={4} dark={dark} /></div>
              <Shimmer width={80} height={12} radius={4} dark={dark} />
              <Shimmer width={14} height={14} radius={4} dark={dark} />
            </div>
          ))}
        </div>
      </div>
      <style jsx global>{`@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }`}</style>
    </div>
  );
}
