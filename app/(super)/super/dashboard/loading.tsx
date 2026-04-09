"use client";
/**
 * app/(super)/super/dashboard/loading.tsx — Dashboard skeleton
 * Ice-blue shimmer loading state matching the dashboard layout.
 */

import { useTheme } from "@/lib/context/ThemeContext";

function ShimmerBlock({
  width,
  height,
  radius = 12,
  dark,
}: {
  width?: string | number;
  height: string | number;
  radius?: number;
  dark: boolean;
}) {
  return (
    <div
      style={{
        width: width ?? "100%",
        height,
        borderRadius: radius,
        background: dark
          ? "linear-gradient(90deg, rgba(10,30,80,0.4) 25%, rgba(26,111,255,0.12) 50%, rgba(10,30,80,0.4) 75%)"
          : "linear-gradient(90deg, rgba(200,220,255,0.4) 25%, rgba(100,180,255,0.2) 50%, rgba(200,220,255,0.4) 75%)",
        backgroundSize: "400px 100%",
        animation: "shimmer 1.4s ease infinite",
      }}
    />
  );
}

export default function SuperDashboardLoading() {
  const { dark, glassFrost, glassBlur, glassOpacity } = useTheme();

  const iceBorder = dark
    ? "rgba(100,200,255,0.12)"
    : "rgba(80,160,255,0.25)";

  const masterGlass = {
    background: dark
      ? `rgba(4, 8, 32, ${(0.78 * glassOpacity / 100).toFixed(2)})`
      : `rgba(220, 235, 255, ${(0.6 * glassOpacity / 100).toFixed(2)})`,
    backdropFilter: glassFrost
      ? `blur(${glassBlur + 24}px) saturate(250%) brightness(${dark ? 1.08 : 1.02})`
      : "none",
    WebkitBackdropFilter: glassFrost
      ? `blur(${glassBlur + 24}px) saturate(250%) brightness(${dark ? 1.08 : 1.02})`
      : "none",
    border: `1px solid ${iceBorder}`,
    boxShadow: dark
      ? `inset 0 1px 0 rgba(120,200,255,0.12), 0 24px 64px rgba(0,5,30,0.65)`
      : `inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(20,80,200,0.10)`,
    borderRadius: 24,
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Grid overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(100,180,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,180,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.06,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "32px 28px 48px",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* Header skeleton */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <ShimmerBlock width={320} height={24} radius={8} dark={dark} />
            <div style={{ marginTop: 8 }}>
              <ShimmerBlock width={200} height={14} radius={6} dark={dark} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <ShimmerBlock width={180} height={36} radius={12} dark={dark} />
            <ShimmerBlock width={120} height={36} radius={12} dark={dark} />
          </div>
        </div>

        {/* 6-up stat grid skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ ...masterGlass, padding: "20px 22px" }}>
              <ShimmerBlock width={100} height={10} radius={4} dark={dark} />
              <div style={{ marginTop: 14 }}>
                <ShimmerBlock width={80} height={32} radius={8} dark={dark} />
              </div>
            </div>
          ))}
        </div>

        {/* Two-column skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {/* Table skeleton */}
          <div style={{ ...masterGlass, padding: "24px 22px" }}>
            <ShimmerBlock width={160} height={14} radius={6} dark={dark} />
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerBlock key={i} height={40} radius={8} dark={dark} />
              ))}
            </div>
          </div>

          {/* AI card skeleton */}
          <div style={{ ...masterGlass, padding: "24px 22px" }}>
            <ShimmerBlock width={120} height={24} radius={8} dark={dark} />
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <ShimmerBlock height={14} radius={4} dark={dark} />
              <ShimmerBlock width="85%" height={14} radius={4} dark={dark} />
              <ShimmerBlock width="70%" height={14} radius={4} dark={dark} />
              <ShimmerBlock width="90%" height={14} radius={4} dark={dark} />
            </div>
          </div>
        </div>

        {/* Quick actions skeleton */}
        <ShimmerBlock width={120} height={10} radius={4} dark={dark} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginTop: 12,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ ...masterGlass, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ShimmerBlock width={36} height={36} radius={10} dark={dark} />
                <ShimmerBlock width={100} height={14} radius={6} dark={dark} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </div>
  );
}
