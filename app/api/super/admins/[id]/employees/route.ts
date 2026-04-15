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
  const { data, error } = await supabase
    .from("users")
    .select(
      `id, email, phone, is_active, role, created_at,
       employee_profiles!left(
         id, full_name, city, state, status, employee_code,
         phone, created_at
       )`
    )
    .eq("created_by_admin", adminId)
    .eq("role", "employee")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Super/Admins/Employees GET]:", error);
    return serverError("Failed to fetch admin's employees");
  }

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
