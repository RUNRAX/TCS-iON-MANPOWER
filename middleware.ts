/**
 * middleware.ts
 *
 * SECURITY LAYERS:
 * Layer 1 (this file):  Cookie-based JWT check — fast, no network call
 * Layer 2 (layout.tsx): getUser() — real Supabase server verification
 * Layer 3 (API routes): verifyRole() — independent per-route verification
 *
 * NOTE: getSession() is used here intentionally for performance.
 * Real verification happens in Layer 2 and Layer 3.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";

// ── Routes that need NO authentication ──────────────────────────────
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/super/login",            // ✅ hidden super admin portal
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/change-password",
  "/api/health",
  "/api/webhooks",
  // ❌ /register is intentionally NOT here — it is BLOCKED
];

const RL_CONFIG: Record<string, number> = {
  "/api/auth":     30,
  "/api/super":   300,
  "/api/admin":   300,
  "/api/employee": 120,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Block /register entirely — employees created by admin only
  if (pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── 2. Rate limiting (API routes only)
  if (pathname.startsWith("/api/")) {
    for (const [prefix, limit] of Object.entries(RL_CONFIG)) {
      if (pathname.startsWith(prefix)) {
        const rateLimitResponse = await rateLimit(request, prefix, limit);
        if (rateLimitResponse) return rateLimitResponse;
        break;
      }
    }
  }

  // ── 3. Allow public routes — no auth needed
  const isPublic =
    pathname === "/" ||
    PUBLIC_ROUTES.filter((r) => r !== "/").some((r) => pathname.startsWith(r));

  if (isPublic) {
    return withSecurityHeaders(NextResponse.next());
  }

  // ── 4. Build Supabase client to read session from cookie
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
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

  // getSession() = reads JWT from cookie, verifies locally — ZERO network call
  // Real verification happens in layout.tsx (Layer 2) and API routes (Layer 3)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ── 5. No session → redirect to appropriate login
  if (!session) {
    if (pathname.startsWith("/super")) {
      return NextResponse.redirect(new URL("/super/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── 6. Read role from JWT app_metadata (server-only writable — safe)
  const userId    = session.user.id;
  const userEmail = session.user.email ?? "";
  const userRole  = (session.user.app_metadata?.role as string) ?? "employee";

  const isSuperAdmin = userRole === "super_admin";
  const isAdmin      = userRole === "admin" || isSuperAdmin;

  // ── 7. STRICT ROLE-ROUTE ENFORCEMENT

  // super_admin must use /super/* — redirect if they land on /admin or /employee
  if (isSuperAdmin && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/super/dashboard", request.url));
  }
  if (isSuperAdmin && pathname.startsWith("/employee")) {
    return NextResponse.redirect(new URL("/super/dashboard", request.url));
  }

  // admin must NOT access /super/* — hard block
  if (pathname.startsWith("/super") && !isSuperAdmin) {
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin/dashboard" : "/login", request.url)
    );
  }

  // employee must NOT access /admin/* — hard block
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/employee/dashboard", request.url));
  }

  // admin must NOT access /employee/* pages — hard block
  if (pathname.startsWith("/employee") && isAdmin) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // ── 8. Inject verified user headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id",    userId);
  requestHeaders.set("x-user-email", userEmail);
  requestHeaders.set("x-user-role",  userRole);

  const finalResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value);
  });

  return withSecurityHeaders(finalResponse);
}

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)",
  ],
};
