export default function RootLoading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
      animation: "loadFadeIn 0.4s ease-out forwards",
    }}>
      {/* Pulsing brand orb */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 18,
        background: "linear-gradient(135deg, #4f9eff, #7c6aff, #a855f7)",
        boxShadow: "0 0 60px rgba(79,158,255,0.35), 0 0 120px rgba(168,85,247,0.15)",
        animation: "orbPulse 2s ease-in-out infinite",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{ color: "#fff", fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>T</span>
      </div>

      {/* Skeleton content block */}
      <div style={{
        width: "min(420px, 85vw)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        {/* Title bar */}
        <div style={{
          height: 16,
          width: "55%",
          borderRadius: 8,
          background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
          backgroundSize: "400px 100%",
          animation: "skeletonSweep 1.6s ease-in-out infinite",
        }} />
        {/* Subtitle bar */}
        <div style={{
          height: 10,
          width: "35%",
          borderRadius: 6,
          background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)",
          backgroundSize: "400px 100%",
          animation: "skeletonSweep 1.6s ease-in-out 0.1s infinite",
        }} />

        {/* Spacer */}
        <div style={{ height: 8 }} />

        {/* Content cards skeleton */}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 20px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(255,255,255,0.015)",
          }}>
            {/* Avatar skeleton */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
              backgroundSize: "400px 100%",
              animation: `skeletonSweep 1.6s ease-in-out ${i * 0.12}s infinite`,
            }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                height: 12,
                width: `${65 - i * 10}%`,
                borderRadius: 6,
                background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
                backgroundSize: "400px 100%",
                animation: `skeletonSweep 1.6s ease-in-out ${0.08 + i * 0.12}s infinite`,
              }} />
              <div style={{
                height: 8,
                width: `${45 - i * 5}%`,
                borderRadius: 4,
                background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)",
                backgroundSize: "400px 100%",
                animation: `skeletonSweep 1.6s ease-in-out ${0.16 + i * 0.12}s infinite`,
              }} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes loadFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(79,158,255,0.35), 0 0 120px rgba(168,85,247,0.15); }
          50% { transform: scale(1.08); box-shadow: 0 0 80px rgba(79,158,255,0.5), 0 0 160px rgba(168,85,247,0.25); }
        }
        @keyframes skeletonSweep {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </div>
  );
}
