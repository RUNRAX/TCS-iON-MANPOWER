/**
 * POST /api/auth/login
 * Authenticates user and sets session cookie via SSR client
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/ratelimit";
import { parseBody, badRequest, serverError, unauthorized } from "@/lib/utils/api";
import { LoginSchema } from "@/lib/validations/schemas";

export async function POST(request: NextRequest) {
  // ── 1. Rate limit
  const limited = await rateLimit(request, "auth");
  if (limited) return limited;

  // ── 2. Validate body
  const parsed = await parseBody(request, LoginSchema);
  if ("error" in parsed) return parsed.error;

  const { identifier, password } = parsed.data;

  // Admin client — used only for privileged DB lookups (no cookie ops)
  const adminClient = createAdminClient();

  try {
    // ── 3. Resolve email from identifier (email or phone)
    const isEmail = identifier.includes("@");
    let resolvedEmail: string | null = isEmail ? identifier : null;

    if (!isEmail) {
      const phone = identifier.replace(/\D/g, "").slice(-10);
      const { data: user, error } = await adminClient
        .from("users")
        .select("email, is_active")
        .eq("phone", phone)
        .single();

      if (error || !user) return unauthorized("Invalid credentials");
      if (!user.is_active) return unauthorized("This account has been deactivated. Contact your admin.");

      resolvedEmail = user.email;
    }

    if (!resolvedEmail) return unauthorized("Invalid credentials");

    // ── 4. Sign in via SSR client so the session cookie is written to the response
    const ssrClient = createClient();
    const { data: authData, error: authError } = await ssrClient.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (authError) {
      console.warn(`[Auth] Failed login for ${identifier}:`, authError.message);
      if (authError.message.includes("Invalid login credentials")) {
        return unauthorized("Invalid credentials. Please check your email/phone and password.");
      }
      if (authError.message.includes("Email not confirmed")) {
        return unauthorized("Please verify your email before logging in.");
      }
      return unauthorized("Login failed. Please try again.");
    }

    if (!authData.user || !authData.session) return unauthorized("Invalid credentials");

    // ── 5. Check user is active + get role from DB
    const { data: dbUser } = await adminClient
      .from("users")
      .select("is_active, role")
      .eq("id", authData.user.id)
      .single();

    if (!dbUser?.is_active) {
      await ssrClient.auth.signOut();
      return unauthorized("Your account has been deactivated. Contact your admin.");
    }

    // ── 6. Sync role into app_metadata (server-only, not client-writable)
    // This ensures middleware reads the correct role from the JWT
    const adminForMeta = createAdminClient();
    await adminForMeta.auth.admin.updateUserById(authData.user.id, {
      app_metadata: { role: dbUser.role },
    }).catch((e) => console.warn("[Auth] app_metadata sync failed:", e));

    // Refresh the session to ensure the JWT in the cookie has the updated app_metadata
    await ssrClient.auth.refreshSession();

    // ── 7. Update last login
    await adminClient
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", authData.user.id);

    // ── 7. Employee profile status
    let profileStatus: string | null = null;
    if (dbUser.role === "employee") {
      const { data: profile } = await adminClient
        .from("employee_profiles")
        .select("status")
        .eq("user_id", authData.user.id)
        .single();
      profileStatus = profile?.status ?? null;
    }

    const redirectTo =
      dbUser.role === "super_admin"
        ? "/super/dashboard"
        : dbUser.role === "admin"
        ? "/admin/dashboard"
        : !profileStatus
        ? "/employee/profile"
        : profileStatus === "pending"
        ? "/employee/profile?status=pending"
        : "/employee/dashboard";

    // ── 8. Return JSON — cookies were already set by ssrClient above
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: dbUser.role,
          profileStatus,
        },
        redirectTo,
      },
    });

  } catch (error) {
    console.error("[Auth/Login] Unexpected error:", error);
    return serverError();
  }
}
