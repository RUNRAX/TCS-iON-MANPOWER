/**
 * app/api/super/admins/[id]/route.ts
 * PATCH /api/super/admins/:id — Admin management actions:
 *   - toggle_active: Enable/disable an admin account
 *   - reset_password: Generate a password reset link
 *   - update_center: Change an admin's center code
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withSuperAdmin, ok, badRequest, serverError, auditLog } from "@/lib/utils/api";

export const PATCH = withSuperAdmin(
  async (request: NextRequest, { userId }, params) => {
    const adminId = params?.id;
    if (!adminId) return badRequest("Admin ID required");

    const supabase = createAdminClient();
    const body = await request.json().catch(() => ({}));
    const { action } = body as {
      action: "toggle_active" | "reset_password" | "update_center";
    };

    // ══════════════════════════════════════════════
    // ACTION: Toggle admin active status
    // ══════════════════════════════════════════════
    if (action === "toggle_active") {
      // Fetch current state
      const { data: u, error: fetchErr } = await supabase
        .from("users")
        .select("is_active, role")
        .eq("id", adminId)
        .single();

      if (fetchErr || !u) return badRequest("Admin not found");
      if (u.role === "super_admin") return badRequest("Cannot deactivate super admin");

      const newActive = !u.is_active;

      // Update users table
      const { error: updateErr } = await supabase
        .from("users")
        .update({ is_active: newActive })
        .eq("id", adminId);

      if (updateErr) {
        console.error("[Super/Admins] Toggle active error:", updateErr.message);
        return serverError();
      }

      // Ban/unban the auth user to immediately lock them out (or restore access)
      if (!newActive) {
        await supabase.auth.admin.updateUserById(adminId, {
          ban_duration: "876600h", // ~100 years = effectively permanent
        });
      } else {
        await supabase.auth.admin.updateUserById(adminId, {
          ban_duration: "none",
        });
      }

      // Audit
      await auditLog({
        userId,
        action: `super_admin.${newActive ? "activate" : "deactivate"}_admin`,
        entityType: "admin",
        entityId: adminId,
        before: { is_active: u.is_active },
        after: { is_active: newActive },
        request,
      });

      return ok({ active: newActive });
    }

    // ══════════════════════════════════════════════
    // ACTION: Force password reset
    // ══════════════════════════════════════════════
    if (action === "reset_password") {
      const { email } = body as { email?: string };
      if (!email) return badRequest("Email is required for password reset");

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const { data: linkData, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
      });

      if (error || !linkData.properties?.hashed_token) {
        console.error("[Super/Admins] Reset link error:", error?.message);
        return serverError("Could not generate reset link");
      }

      const resetUrl = `${appUrl}/reset-password?token_hash=${linkData.properties.hashed_token}&type=recovery`;

      // Audit
      await auditLog({
        userId,
        action: "super_admin.force_password_reset",
        entityType: "admin",
        entityId: adminId,
        after: { email },
        request,
      });

      return ok({ resetUrl, message: "Password reset link generated." });
    }

    // ══════════════════════════════════════════════
    // ACTION: Update center code
    // ══════════════════════════════════════════════
    if (action === "update_center") {
      const { centerCode } = body as { centerCode?: string };

      if (!centerCode || !/^[A-Z]{3}$/.test(centerCode)) {
        return badRequest("Invalid center code. Must be exactly 3 uppercase letters.");
      }

      // Check if center code is already taken by another admin
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("center_code", centerCode)
        .neq("id", adminId)
        .limit(1);

      if (existing && existing.length > 0) {
        return badRequest(`Center code ${centerCode} is already assigned to another admin.`);
      }

      const { error: updateErr } = await supabase
        .from("users")
        .update({ center_code: centerCode })
        .eq("id", adminId);

      if (updateErr) {
        console.error("[Super/Admins] Update center error:", updateErr.message);
        return serverError();
      }

      // Audit
      await auditLog({
        userId,
        action: "super_admin.update_center",
        entityType: "admin",
        entityId: adminId,
        after: { centerCode },
        request,
      });

      return ok({ message: `Center updated to ${centerCode}.` });
    }

    // ── No valid action matched
    return badRequest("Invalid action. Supported: toggle_active, reset_password, update_center");
  }
);
