/**
 * app/api/super/activity/route.ts
 * GET /api/super/activity — Full audit log across all admins
 * Supports pagination via ?page=1&limit=50
 * Returns: logs with joined user info (email, role, center_code)
 */

import { createAdminClient } from "@/lib/supabase/server";
import { withSuperAdmin, ok, serverError } from "@/lib/utils/api";

export const GET = withSuperAdmin(async (request) => {
  const url    = new URL(request.url);
  const limit  = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));
  const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const from   = (page - 1) * limit;

  const supabase = createAdminClient();

  const { data, error, count } = await supabase
    .from("audit_logs")
    .select(
      `
      id, action, entity_type, entity_id, before_value, after_value,
      ip_address, user_agent, created_at,
      user:users!audit_logs_user_id_fkey(email, role, center_code)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    console.error("[Super/Activity] Query error:", error.message);
    return serverError();
  }

  return ok({ logs: data ?? [], total: count ?? 0, page, limit });
});
