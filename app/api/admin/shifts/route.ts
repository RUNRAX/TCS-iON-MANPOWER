/**
 * /api/admin/shifts
 * GET  — List all exam shifts with confirmed count
 * POST — Create a new exam shift
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, ok, created, conflict, serverError, badRequest, unauthorized, auditLog } from "@/lib/utils/api";
import { z } from "zod";

const CreateSchema = z.object({
  title:        z.string().min(2),
  examDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shiftNumber:  z.coerce.number().int().min(1).max(10),
  startTime:    z.string().regex(/^\d{2}:\d{2}$/),
  endTime:      z.string().regex(/^\d{2}:\d{2}$/),
  venue:        z.string().min(2),
  venueAddress: z.string().optional(),
  maxEmployees: z.coerce.number().int().min(1).max(500),
  minEmployees: z.coerce.number().int().min(1).optional(),
  payAmount:    z.coerce.number().int().min(0).optional().default(800),
  notes:        z.string().optional(),
});

export const GET = withAdmin(async (request: NextRequest) => {
  const url    = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));
  const supabase = createAdminClient();

  let q = supabase
    .from("exam_shifts")
    .select(`id, title, exam_date, shift_number, start_time, end_time, venue, venue_address, max_employees, min_employees, status, notes, pay_amount, created_at, published_at, shift_assignments(id, status)`, { count: "exact" })
    .order("exam_date", { ascending: true })
    .order("shift_number", { ascending: true });

  if (status !== "all") q = q.eq("status", status);
  const from = (page - 1) * limit;
  const { data, error, count } = await q.range(from, from + limit - 1);
  if (error) { console.error("[Admin/Shifts GET]:", error); return serverError(); }

  const shifts = (data ?? []).map((s: any) => {
    const assignments = Array.isArray(s.shift_assignments) ? s.shift_assignments : [];
    const confirmedCount = assignments.filter((a: any) => a.status === "confirmed").length;
    return { ...s, confirmed_count: confirmedCount, pay_amount: s.pay_amount ?? 800 };
  });

  return ok({ shifts, pagination: { page, limit, total: count ?? 0 } });
});

export const POST = withAdmin(async (request: NextRequest, { userId }) => {
  let body: any;
  try { body = await request.json(); } catch { return serverError(); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", issues: parsed.error.issues }, { status: 422 });
  }
  const d = parsed.data;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("exam_shifts").select("id").eq("exam_date", d.examDate).eq("shift_number", d.shiftNumber).maybeSingle();
  if (existing) return conflict(`Shift ${d.shiftNumber} already exists on ${d.examDate}.`);

  const { data, error } = await supabase
    .from("exam_shifts")
    .insert({
      title: d.title, exam_date: d.examDate, shift_number: d.shiftNumber,
      start_time: d.startTime, end_time: d.endTime, venue: d.venue,
      venue_address: d.venueAddress ?? null, max_employees: d.maxEmployees,
      min_employees: d.minEmployees ?? 1, pay_amount: d.payAmount,
      notes: d.notes ?? null, created_by: userId, status: "draft",
    })
    .select().single();

  if (error || !data) { console.error("[Admin/Shifts POST]:", error); return serverError(); }
  await auditLog({ userId, action: "shift.create", entityType: "shift", entityId: data.id, after: data, request });
  return created({ shift: data, message: "Shift created. Publish it to make it visible to employees." });
});

// ── PATCH /api/admin/shifts — Edit shift details or cancel a draft shift
export const PATCH = withAdmin(async (request: NextRequest, { userId }) => {
  const supabase = createAdminClient();
  const body = await request.json().catch(() => ({}));
  const { shiftId, action, ...fields } = body;

  if (!shiftId) return badRequest("SHIFT ID REQUIRED");

  if (action === "complete") {
    const { error } = await supabase
      .from("exam_shifts")
      .update({ status: "completed" })
      .eq("id", shiftId)
      .in("status", ["published"]); // Only published shifts can be completed
    if (error) return serverError();
    // Also mark all confirmed assignments as completed
    await supabase
      .from("shift_assignments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("shift_id", shiftId)
      .eq("status", "confirmed");
    return ok({ message: "Shift marked as completed." });
  }

  if (action === "cancel") {
    // We allow cancelling published shifts because of real-world changes. So we don't block it.
    const { data: shift } = await supabase.from("exam_shifts").select("id, title, status").eq("id", shiftId).single();
    const { error } = await supabase.from("exam_shifts").update({ status: "cancelled" }).eq("id", shiftId);
    if (error) return serverError();

    // Mark related assignments as cancelled so it drops out of employee history
    await supabase.from("shift_assignments").update({ status: "cancelled" }).eq("shift_id", shiftId);

    // Try deleting explicit push notifications for this shift
    if (shift?.title) {
        await supabase.from("notifications").delete().like("message", `%${shift.title}%`);
    }

    return ok({ message: "SHIFT CANCELLED" });
  }

  if (action === "publish") {
    const { data: shift } = await supabase.from("exam_shifts").select("status").eq("id", shiftId).single();
    if (!shift) return badRequest("SHIFT NOT FOUND");
    if (shift.status !== "draft") return badRequest("ONLY DRAFT SHIFTS CAN BE PUBLISHED");
    const { error } = await supabase
      .from("exam_shifts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", shiftId);
    if (error) { console.error("[Admin/Shifts PATCH publish]:", error); return serverError(); }

    // Notify all approved employees about the new shift
    try {
      const { data: employees } = await supabase
        .from("employee_profiles")
        .select("user_id, full_name")
        .eq("status", "approved");

      const { data: shiftDetails } = await supabase
        .from("exam_shifts")
        .select("title, venue, exam_date, shift_number, start_time, end_time")
        .eq("id", shiftId)
        .single();

      if (employees && employees.length > 0 && shiftDetails) {
        const notifications = employees.map((emp: any) => ({
          employee_id: emp.user_id,
          title: "New Shift Published",
          message: `${shiftDetails.title} — Shift ${shiftDetails.shift_number} at ${shiftDetails.venue} on ${shiftDetails.exam_date} (${shiftDetails.start_time}–${shiftDetails.end_time})`,
          type: "shift_published",
          read: false,
        }));
        await supabase.from("notifications").insert(notifications);
      }
    } catch (notifErr) {
      console.error("[Admin/Shifts PATCH publish] notification error:", notifErr);
      // Non-fatal — shift is still published even if notifications fail
    }

    await auditLog({ userId, action: "shift.publish", entityType: "shift", entityId: shiftId, after: { status: "published" }, request });
    return ok({ message: "Shift published and employees notified." });
  }

  if (action === "edit") {
    const allowed = ["title","exam_date","shift_number","start_time","end_time","venue","venue_address","max_employees","min_employees","pay_amount","response_deadline","notes"];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) updates[key] = fields[key];
    }
    if (Object.keys(updates).length === 0) return badRequest("NO FIELDS TO UPDATE");
    const { error } = await supabase.from("exam_shifts").update(updates).eq("id", shiftId);
    if (error) return serverError();
    await auditLog({ userId, action: "shift.update", entityType: "shift", entityId: shiftId, after: updates, request });
    return ok({ message: "SHIFT UPDATED" });
  }

  return badRequest("INVALID ACTION");
});
