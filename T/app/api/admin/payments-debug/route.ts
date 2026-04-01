import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select(`id, amount, status, reference_number, cleared_at, notes, created_at,
      employee_id, shift_id,
      employee:employee_profiles!employee_id(full_name, phone),
      shift:exam_shifts!shift_id(exam_date, shift_number, start_time, end_time, venue)`)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ data, error: error || null });
}
