import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ok, serverError, unauthorized } from "@/lib/utils/api";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const role   = request.headers.get("x-user-role");
  if (!userId || role !== "admin") return unauthorized("ADMIN ONLY");

  const supabase = createAdminClient();

  // Pull from audit_logs as admin "notifications"
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,action,entity_type,before_value,after_value,created_at,user_id")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    // audit_logs might not exist yet — return empty gracefully
    return ok({ notifications: [], unread: 0 });
  }

  // Map audit events to notification-like objects
  const notifications = (data ?? []).map(row => ({
    id: row.id,
    type: row.action,
    title: formatAction(row.action, row.entity_type),
    message: formatDetail(row.after_value),
    read: false,
    created_at: row.created_at,
  }));

  return ok({ notifications, unread: notifications.length });
}

function formatAction(action: string, entity: string): string {
  const map: Record<string, string> = {
    "employee.create":        "NEW EMPLOYEE ADDED",
    "shift.create":           "NEW SHIFT CREATED",
    "shift.publish":          "SHIFT PUBLISHED",
    "shift.confirm":          "EMPLOYEE CONFIRMED SHIFT",
    "shift.decline":          "EMPLOYEE DECLINED SHIFT",
    "payment.clear":          "PAYMENT CLEARED",
    "notification.broadcast": "BROADCAST SENT",
    "profile.approve":        "PROFILE APPROVED",
    "profile.reject":         "PROFILE REJECTED",
  };
  return map[action] ?? action.toUpperCase().replace(".", " ");
}

function formatDetail(value: any): string {
  if (!value) return "";
  try {
    const v = typeof value === "string" ? JSON.parse(value) : value;
    return v.title ?? v.name ?? v.email ?? "";
  } catch { return ""; }
}
