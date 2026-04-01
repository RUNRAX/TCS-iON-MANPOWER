import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ok, serverError, unauthorized } from "@/lib/utils/api";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const role   = request.headers.get("x-user-role");
  if (!userId) return unauthorized("NOT AUTHENTICATED");

  const supabase = createAdminClient();

  // Get employee's notifications (most recent 20)
  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title,message,read,created_at")
    .eq("employee_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return serverError();

  const unread = (data ?? []).filter(n => !n.read).length;
  return ok({ notifications: data ?? [], unread });
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return unauthorized("NOT AUTHENTICATED");

  const supabase = createAdminClient();
  const { ids } = await request.json().catch(() => ({ ids: null }));

  let q = supabase.from("notifications").update({ read: true }).eq("employee_id", userId);
  if (ids && Array.isArray(ids) && ids.length > 0) q = q.in("id", ids);

  const { error } = await q;
  if (error) return serverError();
  return ok({ message: "MARKED AS READ" });
}
