/**
 * app/api/super/broadcast/route.ts
 * POST /api/super/broadcast — Send a system-wide email broadcast to all centers
 * Supports targeting: all_employees, all_admins, everyone
 * Optional center filter via centerCode
 * Supports {name} and {employeeName} placeholders in message body
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  withSuperAdmin,
  ok,
  serverError,
  badRequest,
  auditLog,
} from "@/lib/utils/api";
import { sendEmail } from "@/lib/email/send";
import { z } from "zod";

// ── Validation schema

const BroadcastSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(2000),
  targets: z
    .enum(["all_employees", "all_admins", "everyone"])
    .default("all_employees"),
  centerCode: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/)
    .optional(),
});

export const POST = withSuperAdmin(
  async (request: NextRequest, { userId }) => {
    const body = await request.json().catch(() => ({}));
    const parsed = BroadcastSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid broadcast data");

    const { subject, message, targets, centerCode } = parsed.data;
    const supabase = createAdminClient();

    // ── Determine role filter based on target
    let roleFilter: string[];
    if (targets === "all_employees") roleFilter = ["employee"];
    else if (targets === "all_admins") roleFilter = ["admin"];
    else roleFilter = ["employee", "admin"];

    // ── Fetch recipients with joined user data
    const { data: profiles, error: fetchErr } = await Promise.resolve(
      supabase
        .from("employee_profiles")
        .select(
          `
          user_id, full_name, email,
          users!employee_profiles_user_id_fkey(role, is_active, center_code)
        `
        )
        .eq("is_deleted", false)
    ).catch((err: any) => {
      console.error("[Super/Broadcast] Promise rejection:", err);
      return { data: null, error: err };
    });

    if (fetchErr) {
      console.error("[Super/Broadcast] Fetch error:", fetchErr?.message ?? fetchErr);
      return serverError("Failed to fetch recipients");
    }

    // ── Filter by role, active status, and optional center code
    const recipients = (profiles ?? []).filter((p: any) => {
      const u = p.users as any;
      if (!u?.is_active) return false;
      if (!roleFilter.includes(u.role)) return false;
      if (centerCode && u.center_code !== centerCode) return false;
      return true;
    });

    if (recipients.length === 0) {
      return ok({ sent: 0, failed: 0, total: 0, message: "No matching recipients found." });
    }

    // ── Send emails in batches of 10 with 300ms delay between batches
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10);

      await Promise.allSettled(
        batch.map(async (emp: any) => {
          // Personalise message with placeholders
          const personalised = message
            .replace(/{name}/gi, emp.full_name)
            .replace(/{employeeName}/gi, emp.full_name);

          try {
            await sendEmail({
              to: emp.email,
              subject,
              html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#07070f;border-radius:20px;border:1px solid rgba(255,255,255,0.1);">
                  <div style="background:linear-gradient(135deg,var(--tc-primary,#e0550b),#b63b07);padding:16px 20px;border-radius:12px;margin-bottom:24px;">
                    <p style="color:#fff;font-weight:800;font-size:14px;letter-spacing:2px;text-transform:uppercase;margin:0;">TCS iON — System Broadcast</p>
                  </div>
                  <p style="color:#e8e8ff;font-size:14px;line-height:1.7;">${personalised.replace(/\n/g, "<br>")}</p>
                  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
                  <p style="color:rgba(200,200,230,0.4);font-size:11px;">TCS iON Staff Portal · This is an automated system broadcast.</p>
                </div>
              `,
            });
            sent++;
          } catch {
            failed++;
          }
        })
      );

      // Throttle: wait between batches to avoid rate limits
      if (i + 10 < recipients.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    // ── Log broadcast to broadcast_logs table (best effort — table may not exist yet)
    await Promise.resolve(
      supabase
        .from("broadcast_logs")
        .insert({
          admin_id: userId,
          type: "email_system_broadcast",
          title: subject,
          body: message,
          target: targets,
          sent,
          failed,
        })
    ).catch(() => {
      // Silently ignore if broadcast_logs table doesn't exist
    });

    // ── Audit log
    await auditLog({
      userId,
      action: "super_admin.system_broadcast",
      entityType: "broadcast",
      after: { subject, targets, centerCode: centerCode ?? "ALL", sent, failed },
      request,
    });

    return ok({ sent, failed, total: recipients.length });
  }
);
