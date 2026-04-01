/**
 * GET /api/admin/assignments
 * Returns all shift assignments for the matrix view
 */
import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";

export const GET = withAdmin(async () => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shift_assignments")
    .select("id, employee_id, shift_id, status, confirmed_at, created_at")
    .order("created_at", { ascending: false });

  if (error) { console.error("[Admin/Assignments GET]:", error); return serverError(); }
  return ok({ assignments: data ?? [] });
});
