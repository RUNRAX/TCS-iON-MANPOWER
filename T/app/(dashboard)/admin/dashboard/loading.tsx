export default function Loading() {
  return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 72, borderRadius: 14, marginBottom: 12,
          background: "rgba(255,255,255,0.04)",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
    </div>
  );
}
