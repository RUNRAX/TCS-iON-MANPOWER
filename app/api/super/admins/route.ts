/**
 * app/api/super/admins/route.ts
 * GET  /api/super/admins — List all center admins (+ optional center availability check)
 * POST /api/super/admins — Create a new center admin with credentials
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  withSuperAdmin,
  ok,
  created,
  conflict,
  serverError,
  badRequest,
  auditLog,
} from "@/lib/utils/api";
import { sendEmail } from "@/lib/email/send";
import { employeeWelcomeEmail } from "@/lib/email/templates";
import { z } from "zod";

// ── Validation schema for creating a new admin

const CreateAdminSchema = z.object({
  fullName:   z.string().min(2).max(100),
  email:      z.string().email().toLowerCase(),
  phone:      z.string().regex(/^[6-9]\d{9}$/),
  centerCode: z.string().length(3).regex(/^[A-Z]{3}$/).toUpperCase(),
});

// ── GET — List all admins (or check center code availability)

export const GET = withSuperAdmin(async (request) => {
  const url = new URL(request.url);
  const checkCenter = url.searchParams.get("checkCenter");

  const supabase = createAdminClient();

  // If checkCenter param is provided, return availability status
  if (checkCenter) {
    const code = checkCenter.toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      return ok({ available: false, reason: "Invalid format" });
    }
    const { data: existing, error: checkErr } = await Promise.resolve(
      supabase
        .from("users")
        .select("id")
        .eq("center_code", code)
        .limit(1)
    ).catch((e) => ({ data: null as any, error: e }));

    if (checkErr) {
      console.error("[Super/Admins] checkCenter error:", checkErr);
      return ok({ available: false, reason: "Lookup failed" });
    }

    const found = existing ?? [];
    return ok({ available: found.length === 0 });
  }

  // Default: list all admins and employees (exclude super_admin)
  const { data, error } = await Promise.resolve(
    supabase
      .from("users")
      .select(`
        id, email, phone, role, is_active, center_code, last_login_at, created_at,
        employee_profiles(full_name)
      `)
      .in("role", ["admin", "employee"])
      .order("created_at", { ascending: false })
  ).catch((e) => ({ data: null as any, error: e }));

  if (error) {
    console.error("[Super/Admins] GET error:", error?.message ?? error);
    return serverError();
  }

  const admins = (data ?? []).map((u: any) => {
    // employee_profiles can be null (no profile), an object, or an array
    const profiles = u.employee_profiles;
    let fullName = "—";
    if (Array.isArray(profiles) && profiles.length > 0) {
      fullName = profiles[0]?.full_name ?? "—";
    } else if (profiles && typeof profiles === "object" && !Array.isArray(profiles)) {
      fullName = profiles.full_name ?? "—";
    }

    return {
      id:          u.id,
      email:       u.email,
      phone:       u.phone ?? "—",
      role:        u.role,
      isActive:    u.is_active ?? true,
      centerCode:  u.center_code ?? "—",
      fullName,
      lastLoginAt: u.last_login_at,
      createdAt:   u.created_at,
    };
  });

  return ok({ admins });
});

// ── POST — Create a new center admin

export const POST = withSuperAdmin(async (request: NextRequest, { userId }) => {
  const body = await request.json().catch(() => ({}));
  const parsed = CreateAdminSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid admin data");

  const { fullName, email, phone, centerCode } = parsed.data;
  const supabase = createAdminClient();

  // ── Check uniqueness (email, phone, center code)
  const { data: existing } = await Promise.resolve(
    supabase
      .from("users")
      .select("id, email, phone, center_code")
      .or(`email.eq.${email},phone.eq.${phone},center_code.eq.${centerCode}`)
      .limit(1)
  ).catch((e) => ({ data: null as any, error: e }));

  if (existing && existing.length > 0) {
    const dup = existing[0] as any;
    if (dup.email === email) return conflict("An admin with this email already exists.");
    if (dup.phone === phone) return conflict("An admin with this phone already exists.");
    if (dup.center_code === centerCode)
      return conflict(`Center code ${centerCode} is already assigned.`);
  }

  // ── Generate temporary password
  const tempPassword = generateStrongPassword();

  // ── Create auth user in Supabase Auth
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    phone: `+91${phone}`,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin", full_name: fullName, phone },
  });

  if (createErr || !newUser.user) {
    console.error("[Super/Admins] Create user error:", createErr?.message);
    return serverError("Failed to create admin account");
  }

  // ── Update users table with center code and super admin reference
  await supabase
    .from("users")
    .update({
      phone,
      role: "admin",
      center_code: centerCode,
      created_by_super: userId,
    })
    .eq("id", newUser.user.id);

  // ── Create employee profile for the admin
  await supabase.from("employee_profiles").insert({
    user_id: newUser.user.id,
    full_name: fullName,
    phone,
    email,
    address_line1: "—",
    city: "—",
    state: "—",
    pincode: "000000",
    status: "approved",
    id_proof_type: "aadhaar",
    approved_by: userId,
    approved_at: new Date().toISOString(),
  });

  // ── Send welcome email with credentials
  try {
    const emailContent = employeeWelcomeEmail({
      fullName,
      email,
      phone,
      employeeCode: `ADMIN-${centerCode}`,
      tempPassword,
    });
    await sendEmail({
      to: email,
      subject: `[TCS iON] Admin Account Created — Center ${centerCode}`,
      html: emailContent.html,
    });
  } catch (e) {
    console.warn("[Super/Admins] Welcome email failed:", e);
  }

  // ── Write audit log
  await auditLog({
    userId,
    action: "super_admin.create_admin",
    entityType: "admin",
    entityId: newUser.user.id,
    after: { fullName, email, phone, centerCode },
    request,
  });

  return created({
    adminId: newUser.user.id,
    centerCode,
    tempPassword,
    message: `Admin ${fullName} created for center ${centerCode}.`,
  });
});

// ── Password generator — cryptographically random, meets complexity requirements

function generateStrongPassword(): string {
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const upper   = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits  = "23456789";
  const special = "@#$%!";
  const all = lower + upper + digits + special;

  const arr = new Uint8Array(14);
  crypto.getRandomValues(arr);

  // Guarantee at least one of each character class
  const pwd = [
    lower[arr[0] % lower.length],
    upper[arr[1] % upper.length],
    digits[arr[2] % digits.length],
    special[arr[3] % special.length],
  ];

  // Fill remaining 10 characters from the combined set
  for (let i = 4; i < 14; i++) {
    pwd.push(all[arr[i] % all.length]);
  }

  // Fisher-Yates shuffle for uniform distribution
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = arr[i] % (i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }

  return pwd.join("");
}
