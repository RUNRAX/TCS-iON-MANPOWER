// /api/admin/stats — GET
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (request, { userId, userRole }) => {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  let totalEmpQ = supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "employee");
  let activeEmpQ = supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "employee").eq("is_active", true);
  let pendingQ = supabase.from("employee_profiles").select("id", { count: "exact", head: true }).eq("status", "pending");
  let upcomingQ = supabase.from("exam_shifts").select("id", { count: "exact", head: true }).eq("status", "published").gte("exam_date", today);
  let confirmedQ = supabase.from("shift_assignments").select("id, exam_shifts!inner(created_by)", { count: "exact", head: true }).eq("status", "confirmed").gte("created_at", today + "T00:00:00");
  let payoutsQ = supabase.from("payments").select("amount, exam_shifts!inner(created_by)").eq("status", "cleared").gte("cleared_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  if (userRole !== "super_admin") {
    totalEmpQ = totalEmpQ.eq("created_by_admin", userId);
    activeEmpQ = activeEmpQ.eq("created_by_admin", userId);
    pendingQ = pendingQ.eq("approved_by", userId);
    upcomingQ = upcomingQ.eq("created_by", userId);
    confirmedQ = confirmedQ.eq("exam_shifts.created_by", userId);
    payoutsQ = payoutsQ.eq("exam_shifts.created_by", userId);
  }

  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: pendingApprovals },
    { count: upcomingShifts },
    { count: confirmedToday },
    { data: payoutsData },
  ] = await Promise.all([
    totalEmpQ,
    activeEmpQ,
    pendingQ,
    upcomingQ,
    confirmedQ,
    payoutsQ,
  ]);

  const totalPayoutsMonth = payoutsData?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;

  const payload = { totalEmployees: totalEmployees ?? 0, activeEmployees: activeEmployees ?? 0, pendingApprovals: pendingApprovals ?? 0, upcomingShifts: upcomingShifts ?? 0, confirmedToday: confirmedToday ?? 0, totalPayoutsMonth };
  const res = NextResponse.json({ success: true, data: payload });
  res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return res;
});
