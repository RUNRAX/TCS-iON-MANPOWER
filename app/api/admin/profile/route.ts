/**
 * GET /api/admin/profile — Fetch admin profile details
 * PATCH /api/admin/profile — Update admin profile
 */
import { NextRequest } from "next/server";
import { withAdmin, ok, badRequest, serverError } from "@/lib/utils/api";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

export const GET = withAdmin(async (_request: NextRequest, { userId, userEmail, userRole }) => {
  try {
    const supabase = createAdminClient();

    // Fetch from users table + employee_profiles join
    const [{ data: userData }, { data: authData }] = await Promise.all([
      supabase
        .from("users")
        .select("center_code, email, phone, employee_profiles(full_name)")
        .eq("id", userId)
        .single(),
      supabase.auth.admin.getUserById(userId)
    ]);

    const authMeta = authData?.user?.user_metadata ?? {};

    if (!userData) {
      return ok({
        profile: {
          id:          userId,
          email:       userEmail,
          role:        userRole,
          full_name:   authMeta.full_name ?? null,
          phone:       authMeta.phone ?? null,
          center_code: authMeta.center_code ?? null,
        },
      });
    }

    const profileData = Array.isArray(userData.employee_profiles)
      ? userData.employee_profiles[0]
      : userData.employee_profiles;

    return ok({
      profile: {
        id:          userId,
        email:       userData.email ?? userEmail,
        role:        userRole,
        full_name:   (profileData as Record<string, unknown> | null)?.full_name ?? authMeta.full_name ?? null,
        phone:       userData.phone ?? authMeta.phone ?? null,
        center_code: userData.center_code ?? authMeta.center_code ?? null,
      },
    });
  } catch (err) {
    console.error("[Admin/Profile GET]:", err);
    return serverError();
  }
});

const updateProfileSchema = z.object({
  full_name:   z.string().min(2).max(100).optional(),
  phone:       z.string().min(10).max(15).optional(),
  center_code: z.string().max(10).optional(),
});

export const PATCH = withAdmin(async (request: NextRequest, { userId }) => {
  try {
    const supabase = createAdminClient();
    const rawBody = await request.json().catch(() => ({}));
    const parsed = updateProfileSchema.safeParse(rawBody);

    if (!parsed.success) {
      return badRequest(parsed.error.issues.map(i => i.message).join(", "));
    }

    const data = parsed.data;
    if (!data.full_name && !data.phone && !data.center_code) {
      return badRequest("No valid fields to update.");
    }

    // Update users table for fields stored there
    const userUpdates: Record<string, string> = {};
    if (data.phone) userUpdates.phone = data.phone;
    if (data.center_code) userUpdates.center_code = data.center_code;

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from("users").update(userUpdates).eq("id", userId);
    }

    // Update employee_profiles for full_name
    if (data.full_name) {
      await supabase
        .from("employee_profiles")
        .update({ full_name: data.full_name })
        .eq("user_id", userId);
    }

    // Sync key fields to auth user_metadata so JWT stays consistent
    const metadataUpdate: Record<string, string | null> = {};
    if (data.full_name) metadataUpdate.full_name = data.full_name;
    if (data.phone) metadataUpdate.phone = data.phone;
    if (data.center_code) metadataUpdate.center_code = data.center_code;

    if (Object.keys(metadataUpdate).length > 0) {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: metadataUpdate,
      });
    }

    return ok({ message: "Profile updated." });
  } catch (err) {
    console.error("[Admin/Profile PATCH]:", err);
    return serverError();
  }
});
