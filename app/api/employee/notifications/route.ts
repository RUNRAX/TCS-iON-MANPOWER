import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ok, serverError } from "@/lib/utils/api";
import { verifyRole } from "@/lib/auth/verify-request";

export async function GET(request: NextRequest) {
  // ✅ Layer 3: Independent verification — does NOT trust middleware headers
  const { authorized, errorResponse, user } = await verifyRole("employee");
  if (!authorized) return errorResponse!;

  // use user.id to scope the query to this employee only
  // NEVER trust a userId from the request body or query params
  const employeeId = user!.id;

  const supabase = createAdminClient();

  // Get employee's notifications (most recent 20)
  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title,message,read,created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return serverError();

  const unread = (data ?? []).filter(n => !n.read).length;
  return ok({ notifications: data ?? [], unread });
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  // ✅ Layer 3: Independent verification
  const { authorized, errorResponse, user } = await verifyRole("employee");
  if (!authorized) return errorResponse!;

  const employeeId = user!.id;
  const supabase = createAdminClient();
  const { ids } = await request.json().catch(() => ({ ids: null }));

  let q = supabase.from("notifications").update({ read: true }).eq("employee_id", employeeId);
  if (ids && Array.isArray(ids) && ids.length > 0) q = q.in("id", ids);

  const { error } = await q;
  if (error) return serverError();
  return ok({ message: "MARKED AS READ" });
}
