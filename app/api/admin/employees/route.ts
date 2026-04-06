/**
 * /api/admin/employees
 * GET   — List employees (search by email, phone, full_name)
 * POST  — Add new employee (full fields + generate XMP employee code)
 * PATCH — Approve / reject / toggle_active / edit
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  withAdmin, parseBody, ok, created, conflict,
  serverError, badRequest, unauthorized, auditLog,
} from "@/lib/utils/api";
import { AddEmployeeSchema } from "@/lib/validations/schemas";
import { sendEmail } from "@/lib/email/send";
import { employeeWelcomeEmail } from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3018";

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
  let matchedUserIds: string[] | null = null;

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
        .or(`full_name.ilike.%${search}%,employee_code.ilike.%${search}%`),
    ]);

    const fromUsers    = (userRes.data ?? []).map((u: { id: string }) => u.id);
    const fromProfiles = (profileRes.data ?? []).map((p: { user_id: string }) => p.user_id);
    matchedUserIds = [...new Set([...fromUsers, ...fromProfiles])];

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
         id, full_name, city, state, status, employee_code,
         rejection_reason, photo_url, created_at
       )`,
      { count: "exact" }
    )
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (matchedUserIds !== null) {
    query = query.in("id", matchedUserIds);
  }

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) { console.error("[Admin/Employees GET]:", error); return serverError(); }

  // ── Step 3: flatten + apply status filter ─────────────────────────────────
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
      employee_code:    (p?.employee_code as string) ?? null,
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

  const {
    fullName, email, phone, state, city, idProofType,
    altPhone, addressLine1, addressLine2, pincode,
    bankAccount, bankIfsc, bankName, notes,
  } = parsed.data;
  const supabase = createAdminClient();

  // ── Check uniqueness ──
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

  // ── Get admin's center_code ──
  const { data: adminUser } = await supabase
    .from("users")
    .select("center_code")
    .eq("id", userId)
    .single();

  const centerCode = (adminUser as { center_code: string } | null)?.center_code ?? "GEN";

  // ── Generate employee code: XMP-{CENTER}59{SEQ} ──
  let employeeCode: string;
  try {
    const { data: seqData, error: seqError } = await supabase.rpc("next_employee_code", { p_center: centerCode });
    if (seqError) throw seqError;
    employeeCode = seqData as string;
  } catch (e) {
    console.error("[Employees] Failed to generate employee code:", e);
    // Fallback: generate a random code
    employeeCode = `XMP-${centerCode}59${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
  }

  // ── Generate temporary password ──
  const tempPassword = `Tc${generatePassword()}9!`;

  // ── Create auth user ──
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    phone: `+91${phone}`,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: "employee", full_name: fullName, phone, employee_code: employeeCode, invited_by: userId },
  });

  if (createError || !newUser.user) {
    console.error("[Admin/Employees POST]:", createError);
    return serverError("Failed to create employee account.");
  }

  // ── Update users table ──
  await supabase.from("users").update({ phone, created_by_admin: userId }).eq("id", newUser.user.id);

  // ── Create employee profile ──
  const { error: profileError } = await supabase.from("employee_profiles").insert({
    user_id:       newUser.user.id,
    full_name:     fullName,
    phone,
    alt_phone:     altPhone || null,
    email,
    address_line1: addressLine1 || "",
    address_line2: addressLine2 || null,
    city,
    state,
    pincode:       pincode || "",
    id_proof_type: idProofType,
    employee_code: employeeCode,
    status:        "approved",  // Admin-created employees are auto-approved
    approved_by:   userId,
    approved_at:   new Date().toISOString(),
    // Bank details stored as plain text for now (encryption can be added later)
    bank_name:     bankName || null,
  });

  if (profileError) {
    console.error("[Employees] Profile insert failed:", profileError);
    // Clean up auth user
    await supabase.auth.admin.deleteUser(newUser.user.id).catch(() => {});
    return serverError("Failed to create employee profile.");
  }

  // ── Send welcome email ──
  try {
    const emailContent = employeeWelcomeEmail({
      fullName,
      email,
      phone,
      employeeCode,
      tempPassword,
    });
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch (e) {
    console.warn("[Employees] Welcome email failed:", e);
  }

  // ── Audit log ──
  await auditLog({
    userId,
    action: "employee.create",
    entityType: "employee",
    entityId: newUser.user.id,
    after: { fullName, email, phone, employeeCode, centerCode },
    request,
  });

  return created({
    employeeId: newUser.user.id,
    employeeCode,
    tempPassword,
    message: `${fullName} created as ${employeeCode}. Credentials sent via email.`,
  });
});

// ── PATCH /api/admin/employees — Approve / reject / toggle / edit ─────────────
export async function PATCH(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin" && role !== "super_admin") return unauthorized("ADMIN ONLY");

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
