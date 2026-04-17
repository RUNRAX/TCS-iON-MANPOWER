/**
 * GET /api/employee/shifts/history
 * Returns all shift assignments for the logged-in employee
 * with proper shift details and payment info
 */
import { createAdminClient } from "@/lib/supabase/server";
import { withEmployee, ok, serverError } from "@/lib/utils/api";

export const dynamic = 'force-dynamic';

export const GET = withEmployee(async (_req, { userId }) => {
  const supabase = createAdminClient();

  // Get all assignments for this employee with shift details
  const { data: assignments, error } = await supabase
    .from("shift_assignments")
    .select(`
      id, status, confirmed_at, created_at,
      shift:exam_shifts!shift_id(
        id, title, exam_date, shift_number, start_time, end_time, venue, pay_amount
      )
    `)
    .eq("employee_id", userId)
    .order("created_at", { ascending: false });

  if (error) { console.error("[Employee/History GET]:", error); return serverError(); }

  // Separately fetch payments for this employee (avoid broken join)
  const { data: payments } = await supabase
    .from("payments")
    .select("shift_id, status, reference_number, cleared_at")
    .eq("employee_id", userId);

  const paymentMap = new Map<string, { status: string; reference_number: string | null; cleared_at: string | null }>();
  (payments ?? []).forEach((p: any) => {
    paymentMap.set(p.shift_id, p);
  });

  const history = (assignments ?? []).map((a: any) => {
    const s = a.shift;
    const p = paymentMap.get(s?.id);
    return {
      id: a.id,
      shiftId: s?.id,
      title: s?.title ?? "Unknown Shift",
      shiftDate: s?.exam_date,
      shiftNumber: s?.shift_number,
      start_time: s?.start_time,
      end_time: s?.end_time,
      venue: s?.venue,
      amountRupees: s?.pay_amount ?? 800,
      status: a.status,
      payment_status: p?.status ?? null,
      referenceNumber: p?.reference_number ?? null,
      confirmed_at: a.confirmed_at,
    };
  });

  return ok({ history });
});
