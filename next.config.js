/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

// ── Resolve the App URL dynamically across all Vercel environments ──
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3005");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://*.vercel.app https://rawcdn.githack.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://graph.facebook.com https://api.twilio.com https://*.vercel.app https://vercel.live https://vitals.vercel-insights.com https://rawcdn.githack.com",
      "worker-src 'self' blob:",
      "frame-src https://vercel.live",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ").trim(),
  },
];

const nextConfig = {
  typescript: { tsconfigPath: "./tsconfig.json" },

  // ── Dynamic env resolution ──
  env: {
    NEXT_PUBLIC_APP_URL: APP_URL,
  },

  experimental: {
    // Keep under experimental for Next.js 14 (promoted to top-level in v15)
    serverComponentsExternalPackages: [
      "@supabase/supabase-js",
      "@supabase/ssr",
      "@supabase/auth-js",
      "@supabase/postgrest-js",
      "sharp",
    ],

    // Tree-shake large client packages — cuts client bundle and compile time
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
      "date-fns",
      "recharts",
    ],

    // Turbopack config (dev only)
    turbo: {
      resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Don't cache HTML/API responses — apply security headers here
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },

  async redirects() { return []; },

  poweredByHeader: false,
  compress: true,
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,           // suppress Sentry CLI output during builds
  widenClientFileUpload: true,
  hideSourceMaps: true,   // don't expose source maps to the browser
  //disableLogger: true,
  tunnelRoute: "/monitoring-tunnel", // avoids ad-blockers
  //automaticVercelMonitors: true,
});
