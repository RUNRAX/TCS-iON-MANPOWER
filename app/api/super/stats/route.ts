/**
 * app/api/super/stats/route.ts
 * GET /api/super/stats — Cross-center aggregate statistics for the command center
 * Returns: admin counts, employee counts, shift stats, payment totals, center breakdown
 */

import { createAdminClient } from "@/lib/supabase/server";
import { withSuperAdmin, ok, serverError } from "@/lib/utils/api";

export const dynamic = 'force-dynamic';

export const GET = withSuperAdmin(async () => {
  const supabase = createAdminClient();

  // Fetch all data with individual error handling — never return a hard 500
  const [usersRes, shiftsRes, paymentsRes, assignmentsRes] = await Promise.all([
    Promise.resolve(supabase.from("users").select("id, role, is_active, created_at")).catch(() => ({ data: null, error: { message: "users query failed" } })),
    Promise.resolve(supabase.from("exam_shifts").select("id, status, exam_date, center_code")).catch(() => ({ data: null, error: { message: "shifts query failed" } })),
    Promise.resolve(supabase.from("payments").select("id, amount, status, cleared_at")).catch(() => ({ data: null, error: { message: "payments query failed" } })),
    Promise.resolve(supabase.from("shift_assignments").select("id, status, duty_role")).catch(() => ({ data: null, error: { message: "assignments query failed" } })),
  ]);

  // Log errors but don't fail — use empty arrays as fallback
  if (usersRes.error) console.warn("[Super/Stats] Users:", usersRes.error.message);
  if (shiftsRes.error) console.warn("[Super/Stats] Shifts:", shiftsRes.error.message);
  if (paymentsRes.error) console.warn("[Super/Stats] Payments:", paymentsRes.error.message);
  if (assignmentsRes.error) console.warn("[Super/Stats] Assignments:", assignmentsRes.error.message);

  const users       = usersRes.data ?? [];
  const shifts      = shiftsRes.data ?? [];
  const payments    = paymentsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  // Current month boundary for "this month" calculations
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  // Center breakdown — shifts per center
  const centerMap: Record<string, { shifts: number; employees: number }> = {};
  shifts.forEach((s: any) => {
    const cc = s.center_code ?? "GEN";
    if (!centerMap[cc]) centerMap[cc] = { shifts: 0, employees: 0 };
    centerMap[cc].shifts++;
  });

  return ok({
    totalAdmins:       users.filter((u: any) => u.role === "admin").length,
    totalEmployees:    users.filter((u: any) => u.role === "employee").length,
    activeEmployees:   users.filter((u: any) => u.role === "employee" && u.is_active).length,
    totalShifts:       shifts.length,
    publishedShifts:   shifts.filter((s: any) => s.status === "published").length,
    completedShifts:   shifts.filter((s: any) => s.status === "completed").length,
    totalPaymentsAllTime: payments.reduce(
      (s: number, p: any) => s + (p.amount ?? 0), 0
    ) / 100,
    totalPaymentsThisMonth: payments
      .filter(
        (p: any) =>
          p.status === "cleared" && p.cleared_at && new Date(p.cleared_at) >= thisMonth
      )
      .reduce((s: number, p: any) => s + (p.amount ?? 0), 0) / 100,
    pendingPayments:   payments.filter((p: any) => p.status === "pending").length,
    confirmedSlots:    assignments.filter((a: any) => a.status === "confirmed").length,
    centerBreakdown:   centerMap,
  });
});
