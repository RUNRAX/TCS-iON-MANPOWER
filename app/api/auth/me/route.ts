/**
 * app/api/auth/me/route.ts
 * Returns the current authenticated user's identity.
 * ✅ Uses getUser() for real Supabase server verification — NEVER trusts headers.
 */

import { NextRequest } from "next/server";
import { ok, unauthorized } from "@/lib/utils/api";
import { verifyRole } from "@/lib/auth/verify-request";

export async function GET(request: NextRequest) {
  const { authorized, errorResponse, user, role } = await verifyRole("employee");
  if (!authorized) return errorResponse!;

  return ok({ id: user!.id, role: role ?? "employee", email: user!.email ?? "" });
}
