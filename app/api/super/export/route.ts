/**
 * app/api/super/export/route.ts
 * GET /api/super/export — Export all employee data as an XLSX file
 * Includes: profile info, center, active status, last login, total cleared payments
 * Returns: Binary XLSX download with Content-Disposition header
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withSuperAdmin } from "@/lib/utils/api";

export const GET = withSuperAdmin(async (_request: NextRequest) => {
  const supabase = createAdminClient();

  // ── Fetch all employee profiles with joined user data
  const { data: profiles, error: profilesErr } = await supabase
    .from("employee_profiles")
    .select(
      `
      full_name, email, phone, city, state, employee_code, status, created_at,
      user_id,
      users!employee_profiles_user_id_fkey(is_active, center_code, last_login_at)
    `
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (profilesErr) {
    console.error("[Super/Export] Profiles query error:", profilesErr.message);
    return NextResponse.json(
      { error: "server_error", message: "Failed to fetch profile data" },
      { status: 500 }
    );
  }

  // ── Fetch payment totals per employee
  const { data: payments } = await supabase
    .from("payments")
    .select("employee_id, amount, status");

  const payTotals: Record<string, number> = {};
  (payments ?? []).forEach((p: any) => {
    if (p.status === "cleared") {
      payTotals[p.employee_id] =
        (payTotals[p.employee_id] ?? 0) + (p.amount / 100);
    }
  });

  // ── Build spreadsheet rows
  const rows = (profiles ?? []).map((p: any) => ({
    "Employee Code": p.employee_code ?? "—",
    "Full Name": p.full_name,
    Email: p.email,
    Phone: p.phone,
    City: p.city,
    State: p.state,
    Status: p.status,
    Center: (p.users as any)?.center_code ?? "—",
    Active: (p.users as any)?.is_active ? "Yes" : "No",
    "Last Login": (p.users as any)?.last_login_at
      ? new Date((p.users as any).last_login_at).toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      : "Never",
    "Total Paid (₹)": payTotals[p.user_id] ?? 0,
    Joined: new Date(p.created_at).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
  }));

  // ── Generate XLSX using SheetJS (dynamic import to keep bundle size down)
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  ws["!cols"] = [
    { wch: 14 }, // Employee Code
    { wch: 20 }, // Full Name
    { wch: 26 }, // Email
    { wch: 14 }, // Phone
    { wch: 14 }, // City
    { wch: 16 }, // State
    { wch: 12 }, // Status
    { wch: 10 }, // Center
    { wch: 8 },  // Active
    { wch: 14 }, // Last Login
    { wch: 16 }, // Total Paid
    { wch: 14 }, // Joined
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Employees");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tcs-ion-employees-${dateStr}.xlsx"`,
    },
  });
});
