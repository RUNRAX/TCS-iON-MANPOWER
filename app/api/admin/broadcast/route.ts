/**
 * POST /api/admin/broadcast
 * Sends email broadcast to employees about shift assignments.
 * Supports targeting: all, confirmed, or unresponded employees.
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";
import { sendEmail } from "@/lib/email/send";
import { shiftBroadcastEmail } from "@/lib/email/templates";
import { z } from "zod";

const Schema = z.object({
  shiftId: z.string().min(1, "shiftId required"),
  targetGroup: z.enum(["all", "confirmed", "unresponded"]).default("unresponded"),
  customMessage: z.string().max(1000).optional(),
});

export const POST = withAdmin(async (request: NextRequest, { userId }) => {
  let body: unknown;
  try { body = await request.json(); } catch { return ok({ sent: 0, failed: 0 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return ok({ sent: 0, failed: 0 });

  const { shiftId, targetGroup, customMessage } = parsed.data;
  const supabase = createAdminClient();

  // Fetch shift details for email template
  const { data: shift, error: shiftErr } = await supabase
    .from("exam_shifts")
    .select("id, title, exam_date, shift_number, start_time, end_time, venue")
    .eq("id", shiftId)
    .single();
  if (shiftErr || !shift) return ok({ sent: 0, failed: 0, error: "Shift not found" });

  // Get assignments for targeting
  const { data: assignments } = await supabase
    .from("shift_assignments")
    .select("employee_id, status")
    .eq("shift_id", shiftId);
  const assignedSet = assignments ?? [];

  // Fetch all approved employees — include email
  const { data: employees, error } = await supabase
    .from("employee_profiles")
    .select("user_id, full_name, phone, email")
    .eq("is_deleted", false)
    .eq("status", "approved");
  if (error || !employees) return ok({ sent: 0, failed: 0 });

  let targetIds = new Set<string>();

  if (targetGroup === "all") {
    employees.forEach(e => targetIds.add(e.user_id));
  } else if (targetGroup === "confirmed") {
    assignedSet.filter(a => a.status === "confirmed").forEach(a => targetIds.add(a.employee_id));
  } else {
    // unresponded — employees NOT in assignments
    const unresponded = employees.filter(e => !assignedSet.find(a => a.employee_id === e.user_id));
    unresponded.forEach(e => targetIds.add(e.user_id));
  }

  const finalEmployees = employees.filter(e => targetIds.has(e.user_id) && e.email);
  if (finalEmployees.length === 0) return ok({ sent: 0, failed: 0, total: 0 });

  let sent = 0, failed = 0;

  // Send in batches of 10 with delay to avoid rate limits
  for (let i = 0; i < finalEmployees.length; i += 10) {
    const batch = finalEmployees.slice(i, i + 10);
    await Promise.allSettled(batch.map(async (emp) => {
      try {
        const personalizedMsg = (customMessage ?? "")
          .replace("{name}", emp.full_name)
          .replace("{employeeName}", emp.full_name);

        const emailContent = shiftBroadcastEmail({
          employeeName: emp.full_name,
          shiftTitle: shift.title,
          examDate: shift.exam_date,
          shiftNumber: shift.shift_number,
          startTime: shift.start_time,
          endTime: shift.end_time,
          venue: shift.venue,
          customMessage: personalizedMsg || undefined,
        });

        await sendEmail({
          to: emp.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        // Log notification
        await supabase.from("notifications").insert({
          employee_id: emp.user_id,
          type: "custom",
          title: customMessage ? "New Message from Admin" : "Shift Update",
          message: personalizedMsg || `New shift: ${shift.title} on ${shift.exam_date}`,
          whatsapp_sent: false,
          whatsapp_status: "failed",
        }).then(null, () => {});

        sent++;
      } catch (e) {
        console.error("[Broadcast] Email failed for", emp.email, e);
        failed++;
      }
    }));
    if (i + 10 < finalEmployees.length) await new Promise(r => setTimeout(r, 300));
  }

  // Save broadcast log
  await supabase.from("broadcast_logs").insert({
    admin_id: userId,
    type: "email",
    title: customMessage ? "Custom Broadcast" : "Shift Notification",
    body: customMessage || `Shift broadcast for ${shift.title}`,
    target: targetGroup,
    sent,
    failed,
  }).then(null, () => {});

  return ok({ sent, failed, total: finalEmployees.length });
});
