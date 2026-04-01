export default function DashboardLoading() {
  return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: 80, borderRadius: 16, marginBottom: 14,
          background: "rgba(255,255,255,0.04)",
          animation: "pulse 1.5s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.8}}`}</style>
    </div>
  );
}
