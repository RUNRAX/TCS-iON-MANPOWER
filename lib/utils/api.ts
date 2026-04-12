/**
 * lib/utils/api.ts
 * Shared utilities for all API routes:
 * - Standardized response helpers
 * - Auth guard wrapper
 * - Error handling
 * - Request validation
 * - Audit logging helper
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { createAdminClient, getUser, createClient } from "@/lib/supabase/server";

// ── Response helpers

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T): NextResponse {
  return ok(data, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, code?: string): NextResponse {
  return NextResponse.json(
    { error: "bad_request", message, code },
    { status: 400 }
  );
}

export function unauthorized(message = "Authentication required"): NextResponse {
  return NextResponse.json(
    { error: "unauthorized", message },
    { status: 401 }
  );
}

export function forbidden(message = "Insufficient permissions"): NextResponse {
  return NextResponse.json(
    { error: "forbidden", message },
    { status: 403 }
  );
}

export function notFound(resource = "Resource"): NextResponse {
  return NextResponse.json(
    { error: "not_found", message: `${resource} not found` },
    { status: 404 }
  );
}

export function conflict(message: string): NextResponse {
  return NextResponse.json(
    { error: "conflict", message },
    { status: 409 }
  );
}

export function serverError(message = "Internal server error"): NextResponse {
  return NextResponse.json(
    { error: "server_error", message },
    { status: 500 }
  );
}

export function validationError(errors: Record<string, string[]>): NextResponse {
  return NextResponse.json(
    {
      error: "validation_error",
      message: "Request validation failed",
      errors,
    },
    { status: 422 }
  );
}

// ── Parse and validate request body with Zod

export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    let body: unknown;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      const text = await request.text();
      if (!text) return { error: badRequest("Request body is required") };
      body = JSON.parse(text);
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return { error: validationError(errors) };
    }

    return { data: result.data };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { error: badRequest("Invalid JSON in request body") };
    }
    return { error: serverError() };
  }
}

// ── Parse query params with Zod

export function parseQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { data: T } | { error: NextResponse } {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    const errors = formatZodErrors(result.error);
    return { error: validationError(errors) };
  }
  return { data: result.data };
}

// ── Format Zod errors into field→messages map

function formatZodErrors(error: ZodError): Record<string, string[]> {
  return error.issues.reduce(
    (acc, issue) => {
      const field = issue.path.join(".") || "root";
      if (!acc[field]) acc[field] = [];
      acc[field].push(issue.message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}

// ── Auth guard types

interface AuthContext {
  userId: string;
  userRole: "super_admin" | "admin" | "employee";
  userEmail: string;
}

type RouteHandler = (
  request: NextRequest,
  context: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

// ── withAuth — wraps a route handler with auth + role check

export function withAuth(
  handler: RouteHandler,
  requiredRole?: "admin" | "employee"
) {
  return async (
    request: NextRequest,
    { params }: { params?: Record<string, string> } = {}
  ): Promise<NextResponse> => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return unauthorized("Missing authentication token.");

      // Prefer injected headers from middleware (faster)
      const userId    = request.headers.get("x-user-id");
      const userRole  = request.headers.get("x-user-role") as "super_admin" | "admin" | "employee" | null;
      const userEmail = request.headers.get("x-user-email") ?? "";

      if (!userId || !userRole) {
        // Fallback: verify with Supabase directly
        const user = await getUser();
        if (!user) return unauthorized();

        const fallbackRole = (user.app_metadata?.role ?? "employee") as "super_admin" | "admin" | "employee";
        if (requiredRole && fallbackRole !== requiredRole) {
          return forbidden();
        }

        return handler(request, {
          userId: user.id,
          userRole: fallbackRole,
          userEmail: user.email ?? "",
        }, params);
      }

      // Role check
      if (requiredRole) {
        const isSuperAdmin = userRole === "super_admin";
        if (requiredRole === "admin" && userRole !== "admin" && !isSuperAdmin) {
          return forbidden();
        }
        if (requiredRole === "employee" && userRole !== "employee") {
          return forbidden();
        }
      }

      return handler(request, { userId, userRole: userRole as "admin" | "employee", userEmail }, params);
    } catch (error) {
      console.error("[API] Unhandled error:", error);
      return serverError();
    }
  };
}

// ── withAdmin — shorthand for admin-only routes

export function withAdmin(handler: RouteHandler) {
  return withAuth(handler, "admin");
}

// ── withEmployee — shorthand for employee routes

export function withEmployee(handler: RouteHandler) {
  return withAuth(handler, "employee");
}

// ── withSuperAdmin — restricts to super_admin role only

export function withSuperAdmin(handler: RouteHandler) {
  return async (
    request: NextRequest,
    { params }: { params?: Record<string, string> } = {}
  ): Promise<NextResponse> => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return unauthorized("Missing authentication token.");

      // Prefer injected headers from middleware (faster)
      const userId    = request.headers.get("x-user-id");
      const userRole  = request.headers.get("x-user-role");
      const userEmail = request.headers.get("x-user-email") ?? "";

      if (userId && userRole === "super_admin") {
        return handler(request, { userId, userRole: "admin", userEmail }, params);
      }

      // Fallback: verify with Supabase directly
      const user = await getUser();
      if (!user) return unauthorized();

      const adminClient = createAdminClient();
      const { data: dbUser } = await adminClient
        .from("users")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      if (!dbUser?.is_active) return unauthorized("Account deactivated");
      if (dbUser.role !== "super_admin") return forbidden("Super admin access required");

      return handler(request, {
        userId: user.id,
        userRole: "admin",
        userEmail: user.email ?? "",
      }, params);
    } catch (err) {
      console.error("[Super Admin Guard]:", err);
      return serverError();
    }
  };
}

// ── Write audit log from API route

export async function auditLog({
  userId,
  action,
  entityType,
  entityId,
  before,
  after,
  request,
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  request: NextRequest;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
    const ua = request.headers.get("user-agent") ?? null;

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      before_value: before ? (before as Record<string, unknown>) : null,
      after_value: after ? (after as Record<string, unknown>) : null,
      ip_address: ip,
      user_agent: ua,
    });
  } catch (err) {
    // Never fail a request due to audit log failure
    console.error("[Audit] Failed to write audit log:", err);
  }
}

// ── Paginate a Supabase query

export function paginate(
  query: any,
  page: number,
  limit: number
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
}
