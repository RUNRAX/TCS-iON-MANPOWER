/**
 * POST /api/auth/register
 * ❌ BLOCKED — Self-registration is disabled.
 * Employees are created by admins only via /api/admin/employees POST.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "registration_disabled",
      message: "Self-registration is disabled. Employees are created by administrators only.",
    },
    { status: 403 }
  );
}
