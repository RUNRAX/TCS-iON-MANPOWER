// /api/admin/stats — GET
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";

export const GET = withAdmin(async () => {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: pendingApprovals },
    { count: upcomingShifts },
    { count: confirmedToday },
    { data: payoutsData },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "employee"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "employee").eq("is_active", true),
    supabase.from("employee_profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("exam_shifts").select("*", { count: "exact", head: true }).eq("status", "published").gte("exam_date", today),
    supabase.from("shift_assignments").select("*", { count: "exact", head: true }).eq("status", "confirmed").gte("created_at", today + "T00:00:00"),
    supabase.from("payments").select("amount").eq("status", "cleared").gte("cleared_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const totalPayoutsMonth = payoutsData?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;

  const payload = { totalEmployees: totalEmployees ?? 0, activeEmployees: activeEmployees ?? 0, pendingApprovals: pendingApprovals ?? 0, upcomingShifts: upcomingShifts ?? 0, confirmedToday: confirmedToday ?? 0, totalPayoutsMonth };
  const res = NextResponse.json({ success: true, data: payload });
  res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return res;
});
