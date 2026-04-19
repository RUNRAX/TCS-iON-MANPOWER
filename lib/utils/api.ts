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
import * as Sentry from "@sentry/nextjs";

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

export function serverError(message = "Internal server error", err?: unknown): NextResponse {
  if (err) Sentry.captureException(err);
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
// ✅ ALWAYS uses getUser() for real Supabase server verification (Layer 3)
// NEVER trusts x-user-role headers alone — those can be forged

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

      // ✅ getUser() — real network call to Supabase, validates JWT server-side
      // This is the ONLY source of truth for identity and role
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return unauthorized("Missing or invalid authentication.");

      const userId    = user.id;
      const userEmail = user.email ?? "";
      const userRole  = (user.app_metadata?.role ?? "employee") as "super_admin" | "admin" | "employee";

      // Role check with hierarchy
      if (requiredRole) {
        const isSuperAdmin = userRole === "super_admin";
        if (requiredRole === "admin" && userRole !== "admin" && !isSuperAdmin) {
          return forbidden();
        }
        if (requiredRole === "employee" && userRole !== "employee" && userRole !== "admin" && !isSuperAdmin) {
          return forbidden();
        }
      }

      return handler(request, { userId, userRole, userEmail }, params);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { layer: "api", route: request.nextUrl.pathname },
      });
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

      // ✅ getUser() — real Supabase server verification
      // NEVER trusts x-user-role header — that can be forged
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return unauthorized("Missing or invalid authentication.");

      const role = (user.app_metadata?.role as string) ?? "employee";

      if (role !== "super_admin") {
        return forbidden("Super admin access required");
      }

      return handler(request, {
        userId: user.id,
        userRole: "super_admin",
        userEmail: user.email ?? "",
      }, params);
    } catch (err) {
      Sentry.captureException(err, {
        tags: { layer: "api", route: request.nextUrl.pathname },
      });
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
