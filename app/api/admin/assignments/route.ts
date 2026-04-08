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
    .select(`
      id, employee_id, shift_id, status, confirmed_at, created_at,
      shift:exam_shifts(title, exam_date, shift_number, max_employees, start_time, end_time, venue),
      employee:employee_profiles!shift_assignments_employee_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) { console.error("[Admin/Assignments GET]:", error); return serverError(); }
  
  const mapped = (data ?? []).map((a: any) => ({
    id: a.id,
    employee_id: a.employee_id,
    shift_id: a.shift_id,
    status: a.status,
    confirmed_at: a.confirmed_at,
    created_at: a.created_at,
    employee_name: Array.isArray(a.employee) ? a.employee[0]?.full_name : a.employee?.full_name,
    shift_title: Array.isArray(a.shift) ? a.shift[0]?.title : a.shift?.title,
    exam_date: Array.isArray(a.shift) ? a.shift[0]?.exam_date : a.shift?.exam_date,
    shift_number: Array.isArray(a.shift) ? a.shift[0]?.shift_number : a.shift?.shift_number,
    max_employees: Array.isArray(a.shift) ? a.shift[0]?.max_employees : a.shift?.max_employees,
    start_time: Array.isArray(a.shift) ? a.shift[0]?.start_time : a.shift?.start_time,
    end_time: Array.isArray(a.shift) ? a.shift[0]?.end_time : a.shift?.end_time,
    venue: Array.isArray(a.shift) ? a.shift[0]?.venue : a.shift?.venue,
  }));

  return ok({ assignments: mapped });
});
