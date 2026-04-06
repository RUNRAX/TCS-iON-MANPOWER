/**
 * /api/admin/bookings
 * Attendance & duty management for a specific exam date.
 * GET  ?date=YYYY-MM-DD  — all employees + their shift assignments for that date
 * POST — save/update an attendance record (role, notes, present status)
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, ok, created, badRequest, serverError } from "@/lib/utils/api";

// GET: all employees + shifts for a given date
export const GET = withAdmin(async (request: NextRequest) => {
  const url  = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return badRequest("date parameter required (YYYY-MM-DD)");
  }

  const supabase = createAdminClient();

  // 1. Shifts for this date
  const { data: shifts, error: shiftErr } = await supabase
    .from("exam_shifts")
    .select("id, title, shift_number, start_time, end_time, venue, status, max_employees")
    .eq("exam_date", date)
    .neq("status", "cancelled")
    .order("shift_number");
  if (shiftErr) { console.error("[Bookings GET shifts]:", shiftErr); return serverError(); }

  // 2. All approved employees
  const { data: employees, error: empErr } = await supabase
    .from("employee_profiles")
    .select(`id, full_name, email, phone, user_id, status,
             users!employee_profiles_user_id_fkey(id, email, is_active)`)
    .eq("status", "approved")
    .eq("is_deleted", false)
    .order("full_name");
  if (empErr) { console.error("[Bookings GET employees]:", empErr); return serverError(); }

  // 3. Existing assignments for these shifts
  const shiftIds = (shifts ?? []).map((s: Record<string,string>) => s.id);
  let assignments: Record<string, unknown>[] = [];
  if (shiftIds.length > 0) {
    const { data: asgn } = await supabase
      .from("shift_assignments")
      .select("id, employee_id, shift_id, status, duty_role, notes, confirmed_at, completed_at")
      .in("shift_id", shiftIds);
    assignments = (asgn ?? []) as Record<string, unknown>[];
  }

  // Build lookup: employeeId -> shiftId -> assignment
  const lookup: Record<string, Record<string, Record<string,unknown>>> = {};
  assignments.forEach(a => {
    const eid = a.employee_id as string;
    const sid = a.shift_id as string;
    if (!lookup[eid]) lookup[eid] = {};
    lookup[eid][sid] = a;
  });

  return ok({
    date,
    shifts:    shifts    ?? [],
    employees: (employees ?? []).map((e: Record<string, unknown>) => ({
      id:        e.user_id,
      profileId: e.id,
      full_name: e.full_name,
      email:     e.email ?? (e.users as Record<string,unknown> | null)?.email,
      phone:     e.phone,
      assignments: lookup[e.user_id as string] ?? {},
    })),
  });
});

// POST: upsert a single assignment record
export const POST = withAdmin(async (request: NextRequest, { userId }) => {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return badRequest("Invalid JSON"); }

  // Accept both camelCase (dutyRole) and snake_case (duty_role) from frontend
  const { employeeId, shiftId, status, dutyRole, duty_role, notes } = body as {
    employeeId: string; shiftId: string;
    status?: string; dutyRole?: string; duty_role?: string; notes?: string;
  };
  const resolvedRole = dutyRole ?? duty_role ?? null;

  if (!employeeId || !shiftId) return badRequest("employeeId and shiftId required");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shift_assignments")
    .upsert({
      employee_id:  employeeId,
      shift_id:     shiftId,
      status:       status ?? "confirmed",
      duty_role:    resolvedRole,
      notes:        notes ?? null,
      confirmed_at: new Date().toISOString(),
      updated_by:   userId,
    }, { onConflict: "employee_id,shift_id" })
    .select()
    .single();

  if (error) { console.error("[Bookings POST]:", error); return serverError(); }
  return created({ assignment: data });
});
