export default function RootLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#03071e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(79,158,255,0.2)", borderTopColor: "#4F9EFF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
