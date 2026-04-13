// lib/auth/verify-request.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RequiredRole = "employee" | "admin" | "super_admin";

export async function verifyRole(requiredRole: RequiredRole) {
  const supabase = createClient();

  // ✅ getUser() — real Supabase server verification
  // NEVER uses x-user-role header — that can be forged
  // This independently confirms the user's identity and role with Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authorized: false as const,
      user: null,
      role: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized — no valid session" },
        { status: 401 }
      ),
    };
  }

  const role = (user.app_metadata?.role as string) ?? "employee";

  // Check role hierarchy
  const roleHierarchy: Record<string, number> = {
    employee:    1,
    admin:       2,
    super_admin: 3,
  };

  const userLevel     = roleHierarchy[role] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;

  if (userLevel < requiredLevel) {
    return {
      authorized: false as const,
      user: null,
      role,
      errorResponse: NextResponse.json(
        {
          error: `Forbidden — requires ${requiredRole} role, you have ${role}`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true as const,
    user,
    role,
    errorResponse: null,
  };
}
