import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/server";
import { ok, serverError } from "@/lib/utils/api";
import { verifyRole } from "@/lib/auth/verify-request";

export async function GET(request: NextRequest) {
  const { authorized, errorResponse, user } = await verifyRole("employee");
  if (!authorized) return errorResponse!;

  const employeeId = user!.id;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title,message,read,created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    Sentry.captureException(error);
    return serverError("Failed to fetch notifications", error);
  }

  const unread = (data ?? []).filter(n => !n.read).length;
  return ok({ notifications: data ?? [], unread });
}

export async function PATCH(request: NextRequest) {
  const { authorized, errorResponse, user } = await verifyRole("employee");
  if (!authorized) return errorResponse!;

  const employeeId = user!.id;
  const supabase = createAdminClient();
  const { ids } = await request.json().catch(() => ({ ids: null }));

  let q = supabase
    .from("notifications")
    .update({ read: true })
    .eq("employee_id", employeeId);

  if (ids && Array.isArray(ids) && ids.length > 0) q = q.in("id", ids);

  const { error } = await q;
  if (error) {
    Sentry.captureException(error);
    return serverError("Failed to mark notifications as read", error);
  }

  return ok({ message: "MARKED AS READ" });
}
