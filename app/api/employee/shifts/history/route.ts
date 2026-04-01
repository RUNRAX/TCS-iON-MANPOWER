/**
 * GET /api/employee/shifts/history
 * Returns all past and present shift assignments for the logged-in employee
 */
import { createAdminClient } from "@/lib/supabase/server";
import { withEmployee, ok, serverError } from "@/lib/utils/api";

export const GET = withEmployee(async (_req, { userId }) => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shift_assignments")
    .select(`
      id, status, confirmed_at, created_at,
      shift:exam_shifts!shift_id(
        id, title, exam_date, shift_number, start_time, end_time, venue, pay_amount
      ),
      payment:payments!left(status, reference_number, cleared_at)
    `)
    .eq("employee_id", userId)
    .order("created_at", { ascending: false });

  if (error) { console.error("[Employee/History GET]:", error); return serverError(); }

  const history = (data ?? []).map((a: any) => {
    const s = a.shift;
    const p = Array.isArray(a.payment) ? a.payment[0] : a.payment;
    return {
      id: a.id,
      shiftId: s?.id,
      title: s?.title ?? "Unknown Shift",
      exam_date: s?.exam_date,
      shift_number: s?.shift_number,
      start_time: s?.start_time,
      end_time: s?.end_time,
      venue: s?.venue,
      pay_amount: s?.pay_amount ?? 800,
      status: a.status,
      payment_status: p?.status ?? null,
      reference_number: p?.reference_number ?? null,
      confirmed_at: a.confirmed_at,
    };
  });

  return ok({ history });
});
