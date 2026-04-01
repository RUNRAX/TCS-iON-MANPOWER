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
    const latency = Date.now() - start;

    return NextResponse.json(
      {
        status: dbOk ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? "1.0.0",
        services: {
          database: dbOk ? "connected" : "error",
          api: "running",
        },
        latency: `${latency}ms`,
      },
      {
        status: dbOk ? 200 : 503,
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
