/**
 * /api/employee/shifts
 * GET  — List available published shifts (with my assignment status)
 * POST — Confirm a shift assignment
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withEmployee, ok, created, conflict, forbidden, notFound, serverError } from "@/lib/utils/api";

// GET /api/employee/shifts
export const GET = withEmployee(async (_req: NextRequest, { userId }) => {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: shifts, error } = await supabase
    .from("exam_shifts")
    .select(`
      id, title, exam_date, shift_number, start_time, end_time,
      venue, venue_address, max_employees, min_employees, status, notes, pay_amount,
      response_deadline,
      shift_assignments(id, status, employee_id)
    `)
    .eq("status", "published")
    .gte("exam_date", today)
    .order("exam_date", { ascending: true })
    .order("shift_number", { ascending: true });

  if (error) { console.error("[Employee/Shifts GET]:", error); return serverError(); }

  const annotated = (shifts ?? []).map((s: any) => {
    const assignments = Array.isArray(s.shift_assignments) ? s.shift_assignments : [];
    const mine = assignments.find((a: any) => a.employee_id === userId);
    const confirmedCount = assignments.filter((a: any) => a.status === "confirmed").length;
    return {
      id:               s.id,
      title:            s.title,
      examDate:         s.exam_date,
      shiftNumber:      s.shift_number,
      startTime:        s.start_time,
      endTime:          s.end_time,
      venue:            s.venue,
      venueAddress:     s.venue_address,
      maxEmployees:     s.max_employees,
      minEmployees:     s.min_employees ?? 1,
      status:           s.status,
      notes:            s.notes,
      pay_amount:       s.pay_amount ?? 800,
      responseDeadline: s.response_deadline,
      confirmedCount,
      isFull:           confirmedCount >= s.max_employees,
      myStatus:         mine?.status ?? null,
      myAssignmentId:   mine?.id ?? null,
    };
  });

  return ok({ shifts: annotated });
});

// POST /api/employee/shifts — Confirm or decline a shift
export const POST = withEmployee(async (request: NextRequest, { userId }) => {
  let body: any;
  try { body = await request.json(); } catch { return serverError(); }

  const { shiftId, action = "confirm" } = body ?? {};
  if (!shiftId) return notFound("Shift ID required");

  const supabase = createAdminClient();

  // Verify profile is approved
  const { data: profile } = await supabase
    .from("employee_profiles")
    .select("status, full_name, phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile || profile.status !== "approved") {
    return forbidden("Your profile must be approved before you can confirm shifts.");
  }

  // Verify shift is published
  const { data: shift } = await supabase
    .from("exam_shifts")
    .select("id, title, exam_date, shift_number, start_time, end_time, venue, max_employees, pay_amount")
    .eq("id", shiftId)
    .eq("status", "published")
    .maybeSingle();

  if (!shift) return notFound("Shift not found or no longer available.");

  if (action === "decline") {
    // Upsert as declined
    await supabase
      .from("shift_assignments")
      .upsert({ employee_id: userId, shift_id: shiftId, status: "declined" }, { onConflict: "employee_id,shift_id" });
    return ok({ message: "Shift declined." });
  }

  // --- CONFIRM flow ---

  // Check not full
  const { count: confirmCount } = await supabase
    .from("shift_assignments")
    .select("*", { count: "exact", head: true })
    .eq("shift_id", shiftId)
    .eq("status", "confirmed");

  if ((confirmCount ?? 0) >= shift.max_employees) {
    return conflict("This shift is full. Please choose another.");
  }

  // Check no other shift same date
  const { data: sameDay } = await supabase
    .from("shift_assignments")
    .select("id, exam_shifts!inner(exam_date)")
    .eq("employee_id", userId)
    .eq("status", "confirmed")
    .eq("exam_shifts.exam_date", shift.exam_date)
    .limit(1);

  if (sameDay && sameDay.length > 0) {
    return conflict(`You already have a confirmed shift on ${shift.exam_date}.`);
  }

  // Upsert assignment
  const { data: assignment, error } = await supabase
    .from("shift_assignments")
    .upsert(
      { employee_id: userId, shift_id: shiftId, status: "confirmed", confirmed_at: new Date().toISOString() },
      { onConflict: "employee_id,shift_id" }
    )
    .select()
    .single();

  if (error || !assignment) { console.error("[Employee/Shifts POST]:", error); return serverError(); }

  // WhatsApp notification (best effort)
  try {
    const { notifyEmployee } = await import("@/lib/whatsapp/service");
    await notifyEmployee({
      employeeId: userId,
      toPhone: profile.phone,
      type: "shift_confirmed",
      title: "Shift Confirmed",
      message: `✅ *Shift Confirmed!*\n\nHi ${profile.full_name},\n\n📅 ${shift.exam_date} | Shift ${shift.shift_number}\n⏰ ${shift.start_time}–${shift.end_time}\n📍 ${shift.venue}\n💰 ₹${shift.pay_amount ?? 800}\n\nPlease arrive 15 minutes early with your ID.\n\n– TCS ION Team`,
    });
  } catch (e) { console.warn("[Shifts] WhatsApp failed:", e); }

  return created({ assignment, message: "Shift confirmed! You'll receive a WhatsApp confirmation." });
});
