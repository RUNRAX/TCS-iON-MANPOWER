/**
 * GET/PATCH /api/employee/settings
 * Employee notification preferences and settings.
 */
import { NextRequest } from "next/server";
import { withEmployee, ok, badRequest, serverError } from "@/lib/utils/api";
import { createAdminClient } from "@/lib/supabase/server";

export const GET = withEmployee(async (_request: NextRequest, { userId }) => {
  try {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("employee_profiles")
      .select("full_name, phone, email, city, state")
      .eq("user_id", userId)
      .single();

    return ok({
      settings: {
        fullName: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
        email: profile?.email ?? null,
        city: profile?.city ?? null,
        state: profile?.state ?? null,
      },
    });
  } catch (err) {
    console.error("[Employee/Settings GET]:", err);
    return serverError();
  }
});

export const PATCH = withEmployee(async (request: NextRequest, { userId }) => {
  try {
    const supabase = createAdminClient();
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    // Only allow updating safe fields
    const allowedFields = ["phone", "alt_phone", "city", "state", "address_line1", "address_line2", "pincode"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return badRequest("No valid fields to update.");
    }

    const { error } = await supabase
      .from("employee_profiles")
      .update(updates)
      .eq("user_id", userId);

    if (error) {
      console.error("[Employee/Settings PATCH]:", error);
      return serverError();
    }

    return ok({ message: "Settings updated." });
  } catch (err) {
    console.error("[Employee/Settings PATCH]:", err);
    return serverError();
  }
});
