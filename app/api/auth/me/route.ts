/**
 * app/api/auth/me/route.ts
 * Returns the current authenticated user's identity from middleware-injected headers.
 * Used by the super admin layout to verify role before rendering.
 */

import { NextRequest } from "next/server";
import { ok, unauthorized } from "@/lib/utils/api";

export async function GET(request: NextRequest) {
  const userId    = request.headers.get("x-user-id");
  const userRole  = request.headers.get("x-user-role");
  const userEmail = request.headers.get("x-user-email");

  if (!userId) return unauthorized();

  return ok({ id: userId, role: userRole ?? "employee", email: userEmail });
}
