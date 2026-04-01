/**
 * middleware.ts
 * 
 * KEY DESIGN DECISION:
 * We use getSession() NOT getUser() here.
 * getSession() reads the JWT from cookies — ZERO network calls, works offline.
 * getUser() makes an HTTP request to Supabase Auth every time — breaks with IPv6 issues.
 * 
 * Role enforcement happens in the dashboard layout (server component),
 * which runs AFTER middleware passes the request through.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that don't need auth
const PUBLIC_ROUTES = [
  "/",                           // Landing page
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/change-password",
  "/api/health",
  "/api/webhooks",
];

import { rateLimit } from "@/lib/ratelimit";

const RL_CONFIG: Record<string, number> = {
  "/api/auth": 30,
  "/api/admin": 300,
  "/api/employee": 120,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rate limiting (API routes only)
  if (pathname.startsWith("/api/")) {
    for (const [prefix, limit] of Object.entries(RL_CONFIG)) {
      if (pathname.startsWith(prefix)) {
        const rateLimitResponse = await rateLimit(request, prefix, limit);
        if (rateLimitResponse) return rateLimitResponse;
        break;
      }
    }
  }

  // ── 2. Allow public routes with no auth check
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return withSecurityHeaders(NextResponse.next());
  }

  // ── 3. Auth check using getSession() — reads cookies, NO network call
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // getSession() = reads from cookie, verifies JWT locally. NO HTTP to Supabase.
  const { data: { session } } = await supabase.auth.getSession();

  // ── 4. Not authenticated → redirect to login
  if (!session) {
    const url = new URL("/login", request.url);
    if (!pathname.startsWith("/login")) {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  // ── 5. Inject user info headers for API routes (avoids repeated DB lookups)
  // Role is read from user_metadata in the JWT (set during login via updateUser)
  const userId    = session.user.id;
  const userEmail = session.user.email ?? "";
  // Fall back to "employee" if role not in metadata yet
  const userRole  = (session.user.user_metadata?.role as string) ?? "employee";

  response.headers.set("x-user-id",    userId);
  response.headers.set("x-user-email", userEmail);
  response.headers.set("x-user-role",  userRole);

  return withSecurityHeaders(response);
}

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options",         "DENY");
  res.headers.set("X-Content-Type-Options",  "nosniff");
  res.headers.set("Referrer-Policy",         "strict-origin-when-cross-origin");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
