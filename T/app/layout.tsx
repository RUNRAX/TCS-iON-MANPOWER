import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TCS ION Staff Portal",
    template: "%s | TCS ION",
  },
  description: "Manpower management portal for TCS ION exam operations",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366F1",
};

/**
 * BLOCKING inline script — executes synchronously before ANY CSS or paint.
 *
 * Purpose: prevent flash-of-wrong-theme on hard refresh / first load.
 *
 * Logic:
 *  1. Read tc_theme_key, tc_dark, tc_custom from localStorage.
 *  2. If nothing is stored (first ever visit), use "violet" dark defaults.
 *  3. Apply CSS vars + tc-dark/tc-light classes to <html> immediately.
 *
 * This runs BEFORE React hydrates, so the user never sees a wrong theme.
 * React's ThemeContext will read localStorage again on mount and sync
 * its state to match — no mismatch, no flash.
 */
const themeScript = `(function(){
  var HEX = /^#[0-9a-fA-F]{6}$/;
  var THEMES = {
    violet:   ["#6366f1","#8b5cf6","#06b6d4"],
    emerald:  ["#10b981","#059669","#34d399"],
    rose:     ["#f43f5e","#e11d48","#fb7185"],
    amber:    ["#f59e0b","#d97706","#fbbf24"],
    cyan:     ["#06b6d4","#0891b2","#67e8f9"],
    aurora:   ["#a855f7","#06b6d4","#34d399"],
    sunset:   ["#f97316","#ec4899","#fbbf24"],
    ocean:    ["#3b82f6","#06b6d4","#a855f7"],
    neon:     ["#22c55e","#a855f7","#06b6d4"],
    fire:     ["#ef4444","#f97316","#f59e0b"],
    galaxy:   ["#7c3aed","#2563eb","#ec4899"],
    tropical: ["#10b981","#f59e0b","#06b6d4"],
    candy:    ["#ec4899","#a855f7","#6366f1"],
    arctic:   ["#67e8f9","#818cf8","#a78bfa"],
    infrared: ["#ef4444","#7c3aed","#06b6d4"]
  };
  var key = "violet";
  var dark = true;
  var colors = THEMES.violet;
  try {
    var rk = localStorage.getItem("tc_theme_key");
    var rd = localStorage.getItem("tc_dark");
    var rc = localStorage.getItem("tc_custom");
    if (rk) { var k = JSON.parse(rk); if (THEMES[k]) { key = k; colors = THEMES[k]; } }
    if (rd !== null) { dark = JSON.parse(rd) === true; }
    if (key === "custom" && rc) {
      var c = JSON.parse(rc);
      var cp = c.primary, cs = c.secondary, ca = c.accent;
      if (HEX.test(cp) && HEX.test(cs) && HEX.test(ca)) { colors = [cp, cs, ca]; }
      else { key = "violet"; colors = THEMES.violet; }
    }
  } catch(e) {}
  var r = document.documentElement;
  r.style.setProperty("--tc-primary",   colors[0]);
  r.style.setProperty("--tc-secondary", colors[1]);
  r.style.setProperty("--tc-accent",    colors[2]);
  if (dark) { r.classList.add("tc-dark");  r.classList.remove("tc-light"); }
  else      { r.classList.add("tc-light"); r.classList.remove("tc-dark");  }
  r.setAttribute("data-theme", dark ? "dark" : "light");
  r.style.background = dark ? "#07070f" : "#f4f3ff";
  r.style.color      = dark ? "#f0eeff" : "#0f0a2e";
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking script: must be first child of head, no async/defer */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
