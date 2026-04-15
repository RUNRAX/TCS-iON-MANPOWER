/**
 * app/api/super/admins/[id]/employees/route.ts
 * GET /api/super/admins/:id/employees — List employees belonging to a specific admin
 */

import { createAdminClient } from "@/lib/supabase/server";
import { withSuperAdmin, ok, badRequest, serverError } from "@/lib/utils/api";

export const GET = withSuperAdmin(async (request, _ctx, params) => {
  const adminId = params?.id;
  if (!adminId) return badRequest("Admin ID required");

  const supabase = createAdminClient();

  // Fetch employees created by this admin
  const { data: directData, error: directError } = await supabase
    .from("users")
    .select(
      `id, email, phone, is_active, role, created_at,
       employee_profiles!employee_profiles_user_id_fkey(
          id, full_name, city, state, status, employee_code,
          phone, created_at
        )`,
    )
    .eq("created_by_admin", adminId)
    .eq("role", "employee")
    .order("created_at", { ascending: false });

  if (directError) {
    console.error(
      "[Super/Admins/Employees GET] direct query error:",
      directError,
    );
    return serverError("Failed to fetch admin's employees");
  }

  // Fallback for legacy rows where created_by_admin link was not persisted,
  // but employee profile was approved by this admin.
  const directIds = new Set((directData ?? []).map((u: any) => u.id));

  const { data: profileLinks, error: profileLinkError } = await supabase
    .from("employee_profiles")
    .select("user_id")
    .eq("approved_by", adminId);

  if (profileLinkError) {
    console.error(
      "[Super/Admins/Employees GET] profile link query error:",
      profileLinkError,
    );
    return serverError("Failed to fetch admin's employees");
  }

  const fallbackIds = (profileLinks ?? [])
    .map((p: any) => p.user_id)
    .filter((id: string) => !!id && !directIds.has(id));

  let fallbackData: any[] = [];
  if (fallbackIds.length > 0) {
    const { data: fData, error: fError } = await supabase
      .from("users")
      .select(
        `id, email, phone, is_active, role, created_at,
         employee_profiles!employee_profiles_user_id_fkey(
           id, full_name, city, state, status, employee_code,
           phone, created_at
         )`,
      )
      .in("id", fallbackIds)
      .eq("role", "employee");

    if (fError) {
      console.error(
        "[Super/Admins/Employees GET] fallback query error:",
        fError,
      );
      return serverError("Failed to fetch admin's employees");
    }
    fallbackData = fData ?? [];
  }

  const data = [...(directData ?? []), ...fallbackData].sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const employees = (data ?? []).map((u: any) => {
    const profiles = u.employee_profiles;
    const p = Array.isArray(profiles) ? profiles[0] : profiles;
    return {
      id: u.id,
      email: u.email,
      phone: u.phone ?? p?.phone ?? null,
      is_active: u.is_active,
      full_name: p?.full_name ?? null,
      city: p?.city ?? null,
      state: p?.state ?? null,
      status: p?.status ?? "no_profile",
      employee_code: p?.employee_code ?? null,
      joined_at: p?.created_at ?? u.created_at,
    };
  });

  return ok({ employees, total: employees.length });
});
