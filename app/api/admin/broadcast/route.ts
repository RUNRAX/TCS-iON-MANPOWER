/**
 * POST /api/admin/broadcast
 * Sends bulk WhatsApp broadcast to employees
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";
import { z } from "zod";

const Schema = z.object({
  shiftId: z.string().min(1, "shiftId required"),
  targetGroup: z.enum(["all", "confirmed", "unresponded"]).default("unresponded"),
  customMessage: z.string().optional(),
});

export const POST = withAdmin(async (request: NextRequest, { userId }) => {
  let body: any;
  try { body = await request.json(); } catch { return ok({ sent: 0, failed: 0 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return ok({ sent: 0, failed: 0 });

  const { shiftId, targetGroup, customMessage } = parsed.data;
  const supabase = createAdminClient();

  // Get active shift assignments for this shift
  const { data: assignments } = await supabase.from("shift_assignments").select("employee_id, status").eq("shift_id", shiftId);
  const assignedSet = assignments ?? [];

  // Fetch all approved employees
  let query = supabase.from("employee_profiles").select("user_id, full_name, phone").eq("is_deleted", false).eq("status", "approved");
  const { data: employees, error } = await query;
  if (error || !employees) return ok({ sent: 0, failed: 0 });

  let targetIds = new Set<string>();

  if (targetGroup === "all") {
    employees.forEach(e => targetIds.add(e.user_id));
  } else if (targetGroup === "confirmed") {
    assignedSet.filter(a => a.status === "confirmed").forEach(a => targetIds.add(a.employee_id));
  } else if (targetGroup === "unresponded") {
    const unrespondedGroup = employees.filter(e => !assignedSet.find(a => a.employee_id === e.user_id));
    unrespondedGroup.forEach(e => targetIds.add(e.user_id));
  }

  const finalEmployees = employees.filter(e => targetIds.has(e.user_id));
  if (finalEmployees.length === 0) return ok({ sent: 0, failed: 0 });

  const messageBody = customMessage || "You have an update regarding your shift. Please check the portal.";
  const type = "custom";
  const title = customMessage ? "New Message from Admin" : "Shift Update";

  let sent = 0, failed = 0;

  // Send in batches of 10 with delay to avoid rate limits
  for (let i = 0; i < finalEmployees.length; i += 10) {
    const batch = finalEmployees.slice(i, i + 10);
    await Promise.allSettled(batch.map(async (emp) => {
      const personalizedMsg = messageBody.replace("{name}", emp.full_name).replace("{employeeName}", emp.full_name);
      const result = await sendWhatsApp(emp.phone, personalizedMsg);

      // Log notification
      await supabase.from("notifications").insert({
        employee_id: emp.user_id,
        type,
        title,
        message: personalizedMsg,
        whatsapp_sent: result,
        whatsapp_status: result ? "queued" : "failed",
      }).then(null, () => {});

      if (result) sent++; else failed++;
    }));
    if (i + 10 < finalEmployees.length) await new Promise(r => setTimeout(r, 300));
  }

  // Save broadcast log
  await supabase.from("broadcast_logs").insert({
    admin_id: userId,
    type,
    title,
    body: messageBody,
    target: targetGroup,
    sent,
    failed,
  }).then(null, () => {});

  return ok({ sent, failed, total: finalEmployees.length });
});

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;

  // If WhatsApp not configured, simulate success in dev
  if (!token || token.includes("your_") || !phoneId || phoneId.includes("your_")) {
    console.log(`[WhatsApp DEV] Would send to ${phone}: ${message.slice(0, 60)}…`);
    return true; // Simulated success in dev
  }

  try {
    const formatted = `91${phone.replace(/^0|^\+91|^91/, "").replace(/\D/g, "").slice(-10)}`;
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: formatted, type: "text", text: { body: message } }),
    });
    return res.ok;
  } catch { return false; }
}
