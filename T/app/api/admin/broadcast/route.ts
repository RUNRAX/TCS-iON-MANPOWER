/**
 * POST /api/admin/broadcast
 * Sends bulk WhatsApp broadcast to employees
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";
import { z } from "zod";

const Schema = z.object({
  type: z.string().default("custom"),
  title: z.string().default("Broadcast"),
  body: z.string().min(1, "Message body required"),
  target: z.enum(["all", "approved"]).default("approved"),
});

export const POST = withAdmin(async (request: NextRequest, { userId }) => {
  let body: any;
  try { body = await request.json(); } catch { return ok({ sent: 0, failed: 0 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return ok({ sent: 0, failed: 0 });

  const { type, title, body: messageBody, target } = parsed.data;
  const supabase = createAdminClient();

  // Fetch target employees
  let query = supabase.from("employee_profiles").select("user_id, full_name, phone").eq("is_deleted", false);
  if (target === "approved") query = query.eq("status", "approved");

  const { data: employees, error } = await query;
  if (error || !employees) return ok({ sent: 0, failed: 0 });

  let sent = 0, failed = 0;

  // Send in batches of 10 with delay to avoid rate limits
  for (let i = 0; i < employees.length; i += 10) {
    const batch = employees.slice(i, i + 10);
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
    if (i + 10 < employees.length) await new Promise(r => setTimeout(r, 300));
  }

  // Save broadcast log
  await supabase.from("broadcast_logs").insert({
    admin_id: userId,
    type,
    title,
    body: messageBody,
    target,
    sent,
    failed,
  }).then(null, () => {});

  return ok({ sent, failed, total: employees.length });
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
