"use client";

import { useEffect, useState, memo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

export const LiveClock = memo(function LiveClock() {
  const { dark } = useTheme();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) {
    // SSR-safe skeleton — prevents hydration mismatch
    return (
      <div style={{
        height: 60, borderRadius: 16, width: "100%",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }} />
    );
  }

  const hh  = time.getHours()  .toString().padStart(2, "0");
  const mm  = time.getMinutes().toString().padStart(2, "0");
  const ss  = time.getSeconds().toString().padStart(2, "0");
  const blinking = time.getSeconds() % 2 === 0;

  const dateStr = time.toLocaleDateString("en-IN", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });

  const glassBg     = dark ? "rgba(10,8,24,0.45)"      : "rgba(255,255,255,0.55)";
  const glassBorder = dark ? "rgba(255,255,255,0.10)"   : "rgba(0,0,0,0.08)";
  const timeColor   = "var(--tc-primary)";
  const dateColor   = dark ? "rgba(200,195,240,0.40)"   : "rgba(30,20,80,0.40)";

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: "12px 8px",
        borderRadius: 16,
        background: glassBg,
        backdropFilter: "blur(40px) saturate(200%) brightness(1.06)",
        border: `1px solid ${glassBorder}`,
        boxShadow: [
          "inset 0  1.5px 0 rgba(255,255,255,0.18)",
          "inset 0 -1px   0 rgba(0,0,0,0.14)",
          "inset  1px 0   0 rgba(255,255,255,0.08)",
          "inset -1px 0   0 rgba(255,255,255,0.04)",
          "0 12px 36px -8px rgba(0,0,0,0.40)",
        ].join(", "),
        userSelect: "none",
        cursor: "default",
      }}
    >
      <div style={{
        fontFamily: "ui-monospace, 'Courier New', monospace",
        fontWeight: 900,
        fontSize: "1.05rem",
        letterSpacing: "0.10em",
        color: timeColor,
        display: "flex",
        alignItems: "baseline",
        gap: 1,
      }}>
        <span>{hh}</span>
        <span style={{
          opacity: blinking ? 0.9 : 0.15,
          transition: "opacity 0.15s ease",
        }}>:</span>
        <span>{mm}</span>
        <span style={{
          opacity: blinking ? 0.9 : 0.15,
          transition: "opacity 0.15s ease",
        }}>:</span>
        <span style={{ fontSize: "0.82rem" }}>{ss}</span>
      </div>
      <span style={{
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: dateColor,
        marginTop: 2,
      }}>
        {dateStr}
      </span>
    </div>
  );
});
