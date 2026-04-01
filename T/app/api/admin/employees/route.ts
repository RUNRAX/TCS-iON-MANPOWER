/**
 * /api/admin/employees
 * GET   — List employees (search by email, phone, full_name)
 * POST  — Add new employee
 * PATCH — Approve / reject / toggle_active / edit
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  withAdmin, parseBody, ok, created, conflict,
  serverError, badRequest, unauthorized, auditLog,
} from "@/lib/utils/api";
import { AddEmployeeSchema } from "@/lib/validations/schemas";
import { notifyEmployee } from "@/lib/whatsapp/service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── GET /api/admin/employees ─────────────────────────────────────────────────
export const GET = withAdmin(async (request) => {
  const url    = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  const search = (url.searchParams.get("search") ?? "").trim();
  const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));
  const from   = (page - 1) * limit;

  const supabase = createAdminClient();

  // ── Step 1: resolve user IDs that match the search term ───────────────────
  // The users table has email + phone; employee_profiles has full_name.
  // We run both lookups in parallel then union the IDs.
  let matchedUserIds: string[] | null = null; // null = "no search filter"

  if (search) {
    const [userRes, profileRes] = await Promise.all([
      supabase
        .from("users")
        .select("id")
        .eq("role", "employee")
        .or(`email.ilike.%${search}%,phone.ilike.%${search}%`),
      supabase
        .from("employee_profiles")
        .select("user_id")
        .ilike("full_name", `%${search}%`),
    ]);

    const fromUsers    = (userRes.data ?? []).map((u: { id: string }) => u.id);
    const fromProfiles = (profileRes.data ?? []).map((p: { user_id: string }) => p.user_id);
    matchedUserIds = [...new Set([...fromUsers, ...fromProfiles])];

    // Nothing matched — return early (avoids an unnecessary big query)
    if (matchedUserIds.length === 0) {
      return ok({ employees: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }
  }

  // ── Step 2: fetch users + profiles ────────────────────────────────────────
  let query = supabase
    .from("users")
    .select(
      `id, email, phone, is_active, created_at,
       employee_profiles!employee_profiles_user_id_fkey(
         id, full_name, city, state, status,
         rejection_reason, photo_url, created_at
       )`,
      { count: "exact" }
    )
    .eq("role", "employee")
    .order("created_at", { ascending: false });

  if (matchedUserIds !== null) {
    query = query.in("id", matchedUserIds);
  }

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) { console.error("[Admin/Employees GET]:", error); return serverError(); }

  // ── Step 3: flatten + apply status filter (server-side) ───────────────────
  const employees = (data ?? []).flatMap((u: Record<string, unknown>) => {
    const profiles = u.employee_profiles;
    const p = Array.isArray(profiles) ? profiles[0] : profiles as Record<string, unknown> | null;
    const profileStatus: string = (p?.status as string) ?? "no_profile";

    if (status !== "all" && profileStatus !== status) return [];

    return [{
      id:               u.id as string,
      email:            u.email as string,
      phone:            u.phone as string | null,
      is_active:        u.is_active as boolean,
      full_name:        (p?.full_name as string) ?? null,
      city:             (p?.city as string) ?? null,
      state:            (p?.state as string) ?? null,
      status:           profileStatus,
      rejection_reason: (p?.rejection_reason as string) ?? null,
      photo_url:        (p?.photo_url as string) ?? null,
      joined_at:        (p?.created_at as string) ?? (u.created_at as string),
      profile_id:       (p?.id as string) ?? null,
    }];
  });

  return ok({
    employees,
    pagination: {
      page, limit,
      total: status === "all" ? (count ?? 0) : employees.length,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
});

// ── POST /api/admin/employees — Add new employee ─────────────────────────────
export const POST = withAdmin(async (request, { userId }) => {
  const parsed = await parseBody(request, AddEmployeeSchema);
  if ("error" in parsed) return parsed.error;

  const { fullName, email, phone } = parsed.data;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("users")
    .select("id, email, phone")
    .or(`email.eq.${email},phone.eq.${phone}`)
    .limit(1);

  if (existing && existing.length > 0) {
    const dup = existing[0] as { email: string; phone: string };
    if (dup.email === email) return conflict("An employee with this email already exists.");
    if (dup.phone === phone) return conflict("An employee with this phone number already exists.");
  }

  const tempPassword = `Tc${generatePassword()}9!`;

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    phone: `+91${phone}`,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: "employee", full_name: fullName, phone, invited_by: userId },
  });

  if (createError || !newUser.user) {
    console.error("[Admin/Employees POST]:", createError);
    return serverError("Failed to create employee account.");
  }

  await supabase.from("users").update({ phone }).eq("id", newUser.user.id);

  const message = `📋 *TCS ION Manpower Portal*\n\nHello ${fullName}! 👋\n\nYou've been added to the TCS ION Manpower Portal.\n\n📧 Email: ${email}\n📱 Phone: ${phone}\n🔑 Temp Password: ${tempPassword}\n\n👉 Login: ${APP_URL}/login\n\n⚠️ Please complete your profile after logging in.\n\n– TCS ION Admin`;

  try {
    await notifyEmployee({ employeeId: newUser.user.id, toPhone: phone, type: "custom", title: "Welcome to TCS ION Portal", message });
  } catch (e) { console.warn("[Employees] WhatsApp failed:", e); }

  await auditLog({ userId, action: "employee.create", entityType: "employee", entityId: newUser.user.id, after: { fullName, email, phone }, request });

  return created({ employeeId: newUser.user.id, message: `${fullName} added. Credentials sent via WhatsApp.` });
});

// ── PATCH /api/admin/employees — Approve / reject / toggle / edit ─────────────
export async function PATCH(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin") return unauthorized("ADMIN ONLY");

  const supabase = createAdminClient();
  const body = await request.json().catch(() => ({})) as Record<string, string>;
  const { employeeId, action, reason, fullName, phone, city } = body;

  if (!employeeId) return badRequest("EMPLOYEE ID REQUIRED");

  if (action === "approve") {
    const { error } = await supabase
      .from("employee_profiles")
      .update({ status: "approved", rejection_reason: null })
      .eq("user_id", employeeId);
    if (error) return serverError();
    return ok({ message: "Employee approved." });
  }

  if (action === "reject") {
    if (!reason?.trim()) return badRequest("Rejection reason required.");
    const { error } = await supabase
      .from("employee_profiles")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("user_id", employeeId);
    if (error) return serverError();
    return ok({ message: "Employee rejected." });
  }

  if (action === "toggle_active") {
    const { data: u } = await supabase.from("users").select("is_active").eq("id", employeeId).single();
    const newActive = !(u as { is_active: boolean } | null)?.is_active;
    const { error } = await supabase.from("users").update({ is_active: newActive }).eq("id", employeeId);
    if (error) return serverError();
    if (!newActive) {
      await supabase.auth.admin.updateUserById(employeeId, { ban_duration: "876600h" }).catch(() => {});
    } else {
      await supabase.auth.admin.updateUserById(employeeId, { ban_duration: "none" }).catch(() => {});
    }
    return ok({ active: newActive, message: newActive ? "Employee activated." : "Employee deactivated." });
  }

  if (action === "edit") {
    const phoneUpdates: Record<string, string> = {};
    if (phone) phoneUpdates.phone = phone;
    if (Object.keys(phoneUpdates).length > 0) {
      await supabase.from("users").update(phoneUpdates).eq("id", employeeId);
    }
    const profileUpdates: Record<string, string> = {};
    if (fullName) profileUpdates.full_name = fullName;
    if (city) profileUpdates.city = city;
    if (Object.keys(profileUpdates).length > 0) {
      await supabase.from("employee_profiles").update(profileUpdates).eq("user_id", employeeId);
    }
    return ok({ message: "Employee updated." });
  }

  return badRequest("INVALID ACTION");
}

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p = "";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  for (const b of arr) p += chars[b % chars.length];
  return p;
}
