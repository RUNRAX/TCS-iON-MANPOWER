/**
 * GET /api/admin/settings
 * Returns admin settings (center code, etc.)
 */
import { NextRequest } from "next/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";
import { createAdminClient } from "@/lib/supabase/server";

export const GET = withAdmin(async (_request: NextRequest, { userId }) => {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("users")
      .select("center_code, email, phone, employee_profiles(full_name)")
      .eq("id", userId)
      .single();

    const profileData = Array.isArray(data?.employee_profiles) ? data.employee_profiles[0] : data?.employee_profiles;

    return ok({
      settings: {
        centerCode: data?.center_code ?? null,
        email: data?.email ?? null,
        phone: data?.phone ?? null,
        full_name: profileData?.full_name ?? null,
      },
    });
  } catch (err) {
    console.error("[Admin/Settings GET]:", err);
    return serverError();
  }
});
