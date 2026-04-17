import { createAdminClient } from "@/lib/supabase/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (request, { userId, userRole }) => {
  const supabase = createAdminClient();
  let q = supabase
    .from("broadcast_logs")
    .select("id, type, title, target, sent, failed, created_at")
    .order("created_at", { ascending: false });

  if (userRole !== "super_admin") {
    q = q.eq("admin_id", userId);
  }

  const { data, error } = await q.limit(20);

  if (error) { console.error("[Broadcast/History]:", error); return serverError(); }
  return ok({ logs: data ?? [] });
});
