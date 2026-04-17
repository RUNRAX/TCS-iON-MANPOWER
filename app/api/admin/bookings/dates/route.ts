/**
 * GET /api/admin/bookings/dates
 * Returns all exam_dates that have at least one shift (for calendar markers)
 */
import { withAdmin, ok, serverError } from "@/lib/utils/api";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (request, { userId, userRole }) => {
  const supabase = createAdminClient();
  
  let q = supabase
    .from("exam_shifts")
    .select("exam_date, status, title")
    .neq("status", "cancelled")
    .order("exam_date");
    
  if (userRole !== "super_admin") {
    q = q.eq("created_by", userId);
  }

  const { data, error } = await q;
  if (error) return serverError();

  // Deduplicate by date, keeping distinct statuses
  const map: Record<string, { date: string; statuses: string[]; title: string }> = {};
  (data ?? []).forEach((r: Record<string,string>) => {
    if (!map[r.exam_date]) map[r.exam_date] = { date: r.exam_date, statuses: [], title: r.title };
    if (!map[r.exam_date].statuses.includes(r.status)) map[r.exam_date].statuses.push(r.status);
  });

  return ok({ dates: Object.values(map) });
});
