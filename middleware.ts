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

const PUBLIC_ROUTES = [
  "/",
  "/admin/login",
  "/employee/login",
  "/super/login",
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Block /register entirely — employees created by admin only
  if (pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // ── 2. (Removed rate limiting from middleware to improve performance; it should be handled per-route)

  // ── 3. Allow public routes — no auth needed
  const isPublic =
    pathname === "/" ||
    PUBLIC_ROUTES.filter((r) => r !== "/").some((r) => pathname.startsWith(r));

  // We DO NOT return early here anymore. We need to check the session so we
  // can redirect logged-in users AWAY from login pages.

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
          delete options.maxAge;
          delete options.expires;
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          delete options.maxAge;
          delete options.expires;
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

  // ── 4a. Redirect authenticated users AWAY from login pages
  const AUTH_PAGES = ["/login", "/admin/login", "/employee/login", "/super/login"];
  if (session && AUTH_PAGES.includes(pathname)) {
    const role = (session.user.app_metadata?.role as string) ?? "employee";
    if (role === "super_admin") {
      return NextResponse.redirect(new URL("/super/dashboard", request.url));
    } else if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url));
    }
  }

  // ── 4b. If it's a public route (and not an AUTH_PAGE that we just handled), allow it
  if (isPublic) {
    return withSecurityHeaders(response);
  }


  // ── 5. No session → redirect to appropriate login
  if (!session) {
    if (pathname.startsWith("/super")) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (pathname.startsWith("/employee")) {
      return NextResponse.redirect(new URL("/employee/login", request.url));
    }
    // Any other protected route redirects to employee login
    return NextResponse.redirect(new URL("/employee/login", request.url));
  }

  // ── 6. Read role from JWT app_metadata (server-only writable — safe)
  const userId = session.user.id;
  const userEmail = session.user.email ?? "";
  const userRole = (session.user.app_metadata?.role as string) ?? "employee";

  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin" || isSuperAdmin;

  // ── 7. STRICT ROLE-ROUTE ENFORCEMENT

  // Ensure all sensitive API prefixes are strictly gated
  if (pathname.startsWith("/api/super") && !isSuperAdmin) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }
  if (pathname.startsWith("/api/admin") && !isAdmin) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  // super_admin must use /super/* — redirect if they land on /admin or /employee
  if (isSuperAdmin && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/super/dashboard", request.url));
  }
  if (isSuperAdmin && pathname.startsWith("/employee")) {
    return NextResponse.redirect(new URL("/super/dashboard", request.url));
  }

  // If a super_admin hits EXACTLY /super, helpfully route to their dashboard
  if (pathname === "/super" && isSuperAdmin) {
    return NextResponse.redirect(new URL("/super/dashboard", request.url));
  }

  // admin/employee must NOT access /super/* — hard block
  if (pathname.startsWith("/super") && !isSuperAdmin) {
    // Explicit wall: Throw a 404 error if an unauthorized user manually types any super route
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  // If an admin hits EXACTLY /admin, helpfully route to their dashboard
  if (pathname === "/admin" && isAdmin) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // employee must NOT access /admin/* — hard block
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  // If an employee hits EXACTLY /employee, helpfully route to their dashboard
  if (pathname === "/employee" && !isAdmin) {
    return NextResponse.redirect(new URL("/employee/dashboard", request.url));
  }

  // admin must NOT access /employee/* pages — hard block
  if (pathname.startsWith("/employee") && isAdmin) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // ── 8. Inject verified user headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", userId);
  requestHeaders.set("x-user-email", userEmail);
  requestHeaders.set("x-user-role", userRole);

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
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|hdr|glb|gltf)$).*)",
  ],
};
