// /api/employee/payments — GET own payment history
import { createAdminClient } from "@/lib/supabase/server";
import { withEmployee, ok, serverError } from "@/lib/utils/api";

export const GET = withEmployee(async (_req, { userId }) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select(`id, amount, status, reference_number, cleared_at, shift:exam_shifts!shift_id(exam_date, shift_number, start_time, venue)`)
    .eq("employee_id", userId)
    .order("created_at", { ascending: false });
  if (error) return serverError();

  const mapped = (data ?? []).map(p => ({
    id: p.id,
    shiftDate:    (p.shift as any)?.exam_date,
    shiftNumber:  (p.shift as any)?.shift_number,
    venue:        (p.shift as any)?.venue,
    amountRupees: (p.amount ?? 0) / 100,
    status: p.status,
    referenceNumber: p.reference_number,
    clearedAt: p.cleared_at,
  }));

  return ok({ payments: mapped });
});
