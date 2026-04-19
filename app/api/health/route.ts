/**
 * GET /api/health
 * Public health check endpoint for uptime monitoring
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const start = Date.now();

  try {
    // Quick DB connectivity check
    const supabase = createAdminClient();
    const { error } = await supabase.from("users").select("id").limit(1);

    const dbOk = !error;
    const envOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isHealthy = dbOk && envOk;
    const latency = Date.now() - start;

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? "1.0.0",
        region: process.env.VERCEL_REGION ?? "unknown",
        uptime_ms: Math.round(process.uptime() * 1000),
        services: {
          database: dbOk ? "connected" : "error",
          api: "running",
          env: envOk ? "ok" : "missing",
        },
        latency: `${latency}ms`,
      },
      {
        status: isHealthy ? 200 : 503,
        headers: {
          "Cache-Control": "no-store, no-cache",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
