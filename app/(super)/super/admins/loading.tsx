"use client";
/**
 * app/(super)/super/admins/loading.tsx — Admin accounts skeleton
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

export default function SuperAdminsLoading() {
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();
  const iceBorder = dark ? "rgba(100,200,255,0.12)" : "rgba(80,160,255,0.25)";
  const mg = {
    background: dark ? `rgba(4,8,32,${(0.78 * glassOpacity / 100).toFixed(2)})` : `rgba(220,235,255,${(0.6 * glassOpacity / 100).toFixed(2)})`,
    backdropFilter: glassFrost ? `blur(${glassBlur + 24}px) saturate(250%)` : "none",
    WebkitBackdropFilter: glassFrost ? `blur(${glassBlur + 24}px) saturate(250%)` : "none",
    border: `1px solid ${iceBorder}`,
    boxShadow: dark ? `inset 0 1px 0 rgba(120,200,255,0.12), 0 24px 64px rgba(0,5,30,0.65)` : `inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(20,80,200,0.10)`,
    borderRadius: 24,
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(100,180,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,180,255,0.08) 1px, transparent 1px)`,
        backgroundSize: "40px 40px", opacity: 0.06,
      }} />
      <div style={{ position: "relative", zIndex: 1, padding: "32px 28px 48px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Shimmer width={260} height={24} radius={8} dark={dark} />
          <div style={{ marginTop: 8 }}><Shimmer width={320} height={14} radius={6} dark={dark} /></div>
        </div>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1 }}><Shimmer height={44} radius={14} dark={dark} /></div>
          <Shimmer width={180} height={44} radius={14} dark={dark} />
        </div>
        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ ...mg, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
              <Shimmer width={44} height={44} radius={12} dark={dark} />
              <div style={{ flex: 1 }}>
                <Shimmer width={160} height={14} radius={6} dark={dark} />
                <div style={{ marginTop: 6 }}><Shimmer width={200} height={12} radius={4} dark={dark} /></div>
              </div>
              <Shimmer width={60} height={30} radius={8} dark={dark} />
              <Shimmer width={70} height={26} radius={8} dark={dark} />
              <Shimmer width={70} height={14} radius={4} dark={dark} />
            </div>
          ))}
        </div>
      </div>
      <style jsx global>{`@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }`}</style>
    </div>
  );
}
