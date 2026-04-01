/**
 * lib/auth/middleware.ts
 * Auth guard wrappers compatible with all API routes in this project.
 * Exports both naming conventions used across the codebase.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface AuthContext {
  userId: string;
  userRole: "admin" | "employee";
  userEmail: string;
}

type RouteHandler = (
  request: NextRequest,
  context: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

function unauthorized(message = "Authentication required") {
  return NextResponse.json({ error: "unauthorized", message }, { status: 401 });
}
function forbidden(message = "Insufficient permissions") {
  return NextResponse.json({ error: "forbidden", message }, { status: 403 });
}
function serverError(message = "Internal server error") {
  return NextResponse.json({ error: "server_error", message }, { status: 500 });
}

function createGuard(requiredRole?: "admin" | "employee") {
  return function withRole(handler: RouteHandler) {
    return async (
      request: NextRequest,
      { params }: { params?: Record<string, string> } = {}
    ): Promise<NextResponse> => {
      try {
        // Try headers first (injected by middleware)
        const userId    = request.headers.get("x-user-id");
        const userRole  = request.headers.get("x-user-role") as "admin" | "employee" | null;
        const userEmail = request.headers.get("x-user-email") ?? "";

        if (userId && userRole) {
          if (requiredRole && userRole !== requiredRole) return forbidden();
          return handler(request, { userId, userRole, userEmail }, params);
        }

        // Fallback: verify with Supabase
        const supabase = createAdminClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return unauthorized();

        const { data: dbUser } = await supabase
          .from("users")
          .select("role, is_active")
          .eq("id", user.id)
          .single();

        if (!dbUser?.is_active) return unauthorized("Account deactivated");

        const role = dbUser.role as "admin" | "employee";
        if (requiredRole && role !== requiredRole) return forbidden();

        return handler(request, { userId: user.id, userRole: role, userEmail: user.email ?? "" }, params);
      } catch (err) {
        console.error("[Auth Guard] Error:", err);
        return serverError();
      }
    };
  };
}

// All naming conventions used across the codebase
export const withAuth         = createGuard();
export const withAdmin        = createGuard("admin");
export const withEmployee     = createGuard("employee");
export const withAdminAuth    = createGuard("admin");
export const withEmployeeAuth = createGuard("employee");
