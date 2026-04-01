import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";

const ACTION_META: Record<string, { icon: string; label: string }> = {
  "employee.create":        { icon: "👤", label: "Employee added" },
  "shift.create":           { icon: "📅", label: "Shift created" },
  "shift.publish":          { icon: "📢", label: "Shift published" },
  "shift.confirm":          { icon: "✅", label: "Shift confirmed" },
  "profile.submit":         { icon: "📋", label: "Profile submitted" },
  "payment.clear":          { icon: "💰", label: "Payment cleared" },
  "notification.broadcast": { icon: "📣", label: "Broadcast sent" },
};

export const GET = withAdmin(async (request) => {
  const url = new URL(request.url);
  const limit = Math.min(20, parseInt(url.searchParams.get("limit") ?? "10"));
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, after_value, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return serverError();

  const items = (data ?? []).map(log => {
    const meta = ACTION_META[log.action] ?? { icon: "📋", label: log.action };
    const after = log.after_value as any;
    let detail = "";
    if (log.action === "employee.create") detail = after?.fullName ?? "";
    if (log.action === "shift.create" || log.action === "shift.publish") detail = after?.title ?? "";
    if (log.action === "payment.clear") detail = `₹${after?.amountRupees ?? ""}`;
    return {
      id: log.id, icon: meta.icon,
      title: meta.label + (detail ? ` — ${detail}` : ""),
      action: log.action,
      time: new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      created_at: log.created_at,
    };
  });

  return ok({ data: items });
});
