import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare"; // Explicitly edge-safe
import { logger } from "@/lib/logger";

/**
 * lib/ratelimit.ts
 *
 * Production-ready rate limiting bridge.
 * - Uses Upstash Redis if available (distributed, production-grade).
 * - Per-prefix limiters with appropriate windows per route category.
 * - Falls back to a local Map in dev/stg if Redis is missing.
 */

// Initialize Redis if environment variables are present
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? Redis.fromEnv({
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Per-prefix limiters with correct sliding windows
const ratelimiters = redis ? {
  "/api/auth":     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"),  prefix: "rl:auth",     analytics: true }),
  "/api/admin":    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, "60 s"), prefix: "rl:admin",    analytics: true }),
  "/api/employee": new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"),  prefix: "rl:employee", analytics: true }),
} : null;

// Local fallback Map for development/testing without Redis
const localLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  request: NextRequest,
  limiterKey: string,
  limit: number = 30,
  windowMs: number = 60_000
): Promise<NextResponse | null> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
  const id = `${ip}:${limiterKey}`;

  // 1. If Redis is available, use the correct per-prefix distributed limiter
  if (ratelimiters) {
    const limiter = ratelimiters[limiterKey as keyof typeof ratelimiters] ?? ratelimiters["/api/employee"];
    try {
      const { success, limit: l, remaining, reset } = await limiter.limit(id);
      if (!success) {
        logger.warn(`Cloud Rate Limit Hit: ${id}`, { remaining, reset });
        return NextResponse.json(
          { error: "rate_limited", message: "Too many requests. Please slow down." },
          { status: 429, headers: { "X-RateLimit-Limit": l.toString(), "X-RateLimit-Remaining": remaining.toString(), "X-RateLimit-Reset": reset.toString() } }
        );
      }
      return null;
    } catch (e) {
      logger.error("Ratelimit Service Error", e);
      // Fall through to local fallback if cloud service fails (fail-open for UX)
    }
  }

  // 2. Local Fallback (In-memory) — works in dev, resets per serverless invocation in prod
  const now = Date.now();
  const entry = localLimitMap.get(id);

  if (!entry || now > entry.resetAt) {
    localLimitMap.set(id, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= limit) {
    logger.warn(`Local Rate Limit Hit: ${id} (${entry.count}/${limit})`);
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  entry.count++;
  return null;
}