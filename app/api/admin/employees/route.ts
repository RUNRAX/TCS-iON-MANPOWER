/**
 * /api/admin/employees
 * GET   — List employees (search by email, phone, full_name)
 * POST  — Add new employee (full fields + generate XMP employee code)
 * PATCH — Approve / reject / toggle_active / edit
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  withAdmin,
  parseBody,
  ok,
  created,
  conflict,
  serverError,
  badRequest,
  unauthorized,
  auditLog,
  validationError,
} from "@/lib/utils/api";
import { AddEmployeeSchema } from "@/lib/validations/schemas";
import { sendEmail } from "@/lib/email/send";
import { employeeWelcomeEmail, verificationEmail } from "@/lib/email/templates";
import { encrypt } from "@/lib/utils/encryption";
import { z } from "zod";

/* ── Flexible schema — accepts both camelCase and snake_case field names ── */
const createEmployeeSchema = z
  .object({
    // Name — camelCase (modal) or snake_case
    full_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .optional(),
    fullName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .optional(),
    email: z.string().email("Invalid email"),
    password: z.string().min(8).optional(),
    // Phone — any of these
    phone: z.string().min(10).max(15).optional(),
    phone_number: z.string().min(10).max(15).optional(),
    phoneNumber: z.string().min(10).max(15).optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().max(10).optional(),
    // ID proof — any of these
    id_proof: z.string().optional(),
    id_proof_type: z.string().optional(),
    id_type: z.string().optional(),
    idProofType: z.string().optional(),
    role: z.literal("employee").optional(),
    center_code: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    // Optional fields from multi-step form (camelCase)
    altPhone: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    bankAccount: z.string().optional(),
    bankIfsc: z.string().optional(),
    bankName: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => !!(d.full_name || d.fullName), {
    message: "Name is required",
    path: ["fullName"],
  });

/* ── Secure temp password generator ── */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  return (
    Array.from(
      { length: 12 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("") + "Aa1!"
  );
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3018";

// ── GET /api/admin/employees ─────────────────────────────────────────────────
export const GET = withAdmin(async (request, { userId, userRole }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  const search = (url.searchParams.get("search") ?? "").trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));
  const from = (page - 1) * limit;

  const supabase = createAdminClient();

  // ── Step 1: resolve user IDs that match the search term ───────────────────
  let matchedUserIds: string[] | null = null;

  if (search) {
    let usersQuery = supabase
      .from("users")
      .select("id")
      .neq("role", "super_admin")
      .or(`email.ilike.%${search}%,phone.ilike.%${search}%`);

    let profilesQuery = supabase
      .from("employee_profiles")
      .select("user_id")
      .or(`full_name.ilike.%${search}%,employee_code.ilike.%${search}%`);

    if (userRole !== "super_admin") {
      // Admins see all employees + co-admins (broadened from created_by_admin only)
      usersQuery = usersQuery.or(`role.eq.employee,role.eq.admin`);
    }

    const [userRes, profileRes] = await Promise.all([
      usersQuery,
      profilesQuery,
    ]).catch(() => [{ data: null }, { data: null }]);

    const fromUsers = (userRes.data ?? []).map((u: { id: string }) => u.id);
    const fromProfiles = (profileRes.data ?? []).map(
      (p: { user_id: string }) => p.user_id,
    );
    matchedUserIds = [...new Set([...fromUsers, ...fromProfiles])];

    if (matchedUserIds.length === 0) {
      return ok({
        employees: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }
  }

  // ── Step 2: fetch users + profiles ────────────────────────────────────────
  let query = supabase
    .from("users")
    .select(
      `id, email, phone, is_active, role, created_at, email_verified,
       employee_profiles!employee_profiles_user_id_fkey(
         id, full_name, city, state, status, employee_code,
         rejection_reason, photo_url, created_at
       )`,
      { count: "exact" },
    )
    .neq("role", "super_admin")
    .order("created_at", { ascending: false });

  if (userRole !== "super_admin") {
    // Admins see all employees + co-admins (broadened so no employee is hidden)
    query = query.or(`role.eq.employee,role.eq.admin`);
  }

  if (matchedUserIds !== null) {
    query = query.in("id", matchedUserIds);
  }

  const { data, error, count } = await Promise.resolve(
    query.range(from, from + limit - 1),
  ).catch((err: any) => {
    console.error("[Admin/Employees GET] Promise rejection:", err);
    return { data: null, error: err, count: 0 };
  });
  if (error) {
    console.error("[Admin/Employees GET]:", error);
    return serverError("Failed to fetch employees");
  }

  // ── Step 3: flatten + apply status filter ─────────────────────────────────
  const employeesToHeal: string[] = [];

  const employees = (data ?? []).flatMap((u: Record<string, unknown>) => {
    const profiles = u.employee_profiles;
    const p = Array.isArray(profiles)
      ? profiles[0]
      : (profiles as Record<string, unknown> | null);
    const profileStatus: string = (p?.status as string) ?? "no_profile";

    if (status !== "all" && profileStatus !== status) return [];

    // ── Auto-heal: if approved but inactive, track to fix and correct in UI ──
    if (u.is_active === false && profileStatus === "approved") {
      employeesToHeal.push(u.id as string);
      u.is_active = true;
    }

    return [
      {
        id: u.id as string,
        email: u.email as string,
        phone: u.phone as string | null,
        is_active: u.is_active as boolean,
        email_verified: (u.email_verified as boolean | null) ?? false,
        full_name:
          (p?.full_name as string) ??
          (u.role === "admin" ? "PORTAL ADMIN" : null),
        city: (p?.city as string) ?? null,
        state: (p?.state as string) ?? null,
        status: u.role === "admin" ? "approved" : profileStatus,
        employee_code: (p?.employee_code as string) ?? null,
        rejection_reason: (p?.rejection_reason as string) ?? null,
        photo_url: (p?.photo_url as string) ?? null,
        joined_at: (p?.created_at as string) ?? (u.created_at as string),
        profile_id: (p?.id as string) ?? null,
      },
    ];
  });

  if (employeesToHeal.length > 0) {
    // Fire and forget self-healing
    supabase.from("users").update({ is_active: true }).in("id", employeesToHeal).then();
  }

  return ok({
    employees,
    pagination: {
      page,
      limit,
      total: status === "all" ? (count ?? 0) : employees.length,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
});

// ── POST /api/admin/employees — Add new employee ─────────────────────────────
export const POST = withAdmin(async (request, { userId }) => {
  // Try the new flexible schema first (snake_case from multi-step form)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body is required");
  }

  const flexResult = createEmployeeSchema.safeParse(body);

  // If the flexible schema works, use the new path
  if (flexResult.success) {
    const data = flexResult.data;
    const supabase = createAdminClient();

    // ── Normalise aliased fields (camelCase + snake_case) ──
    const fullName = data.fullName ?? data.full_name ?? "";
    const phone = data.phone ?? data.phone_number ?? data.phoneNumber ?? null;
    const idProofType =
      data.idProofType ??
      data.id_proof ??
      data.id_proof_type ??
      data.id_type ??
      null;
    const tempPassword = data.password ?? generateTempPassword();

    // ── Check uniqueness ──
    if (phone) {
      const { data: existing } = await supabase
        .from("users")
        .select("id, email, phone")
        .or(`email.eq.${data.email},phone.eq.${phone}`)
        .limit(1);

      if (existing && existing.length > 0) {
        const dup = existing[0] as { email: string; phone: string };
        if (dup.email === data.email)
          return conflict("An employee with this email already exists.");
        if (dup.phone === phone)
          return conflict("An employee with this phone number already exists.");
      }
    } else {
      const { data: existing } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", data.email)
        .limit(1);
      if (existing && existing.length > 0) {
        return conflict("An employee with this email already exists.");
      }
    }

    // ── Get admin's center_code ──
    const { data: adminUser } = await supabase
      .from("users")
      .select("center_code")
      .eq("id", userId)
      .single();

    const centerCode =
      data.center_code ??
      (adminUser as { center_code: string } | null)?.center_code ??
      "GEN";

    // ── Generate employee code: XMP-{CENTER}59{SEQ} ──
    let employeeCode: string;
    try {
      const { data: seqData, error: seqError } = await supabase.rpc(
        "next_employee_code",
        { p_center: centerCode },
      );
      if (seqError) throw seqError;
      employeeCode = seqData as string;
    } catch {
      employeeCode = `XMP-${centerCode}59${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
    }

    // ── Create auth user ──
    const { data: authUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        app_metadata: { role: "employee" },
        user_metadata: {
          full_name: fullName,
          phone,
          center_code: centerCode,
          role: "employee",
        },
      });

    if (createError || !authUser.user) {
      console.error("[Admin/Employees POST]:", createError);
      return serverError("Failed to create employee account.");
    }

    // ── Update users table (critical ownership link) ──
    const { data: linkedRows, error: linkError } = await supabase
      .from("users")
      .update({
        phone: phone ?? undefined,
        center_code: centerCode,
        role: "employee",
        created_by_admin: userId,
        is_active: true,
      })
      .eq("id", authUser.user.id)
      .select("id");

    if (linkError || !linkedRows || linkedRows.length === 0) {
      console.error(
        "[Admin/Employees POST] Failed to persist created_by_admin link",
        {
          adminId: userId,
          newUserId: authUser.user.id,
          error: linkError,
        },
      );
      await supabase.auth.admin.deleteUser(authUser.user.id).catch(() => {});
      return serverError("Failed to link employee to admin owner.");
    }

    // ── Create employee profile ──
    const { error: profileError } = await supabase
      .from("employee_profiles")
      .insert({
        user_id: authUser.user.id,
        full_name: fullName,
        phone: phone ?? "",
        email: data.email,
        city: data.city ?? "",
        state: data.state ?? "",
        pincode: data.pincode ?? "",
        id_proof_type: idProofType,
        employee_code: employeeCode,
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
        address_line1: data.addressLine1 || "",
        address_line2: data.addressLine2 || null,
        alt_phone: data.altPhone || null,
        bank_name: data.bankName || null,
      });

    if (profileError) {
      console.error("[Employees] Profile insert failed:", profileError);
      await supabase.auth.admin.deleteUser(authUser.user.id).catch(() => {});
      return serverError("Failed to create employee profile.");
    }

    // ── Send welcome email ──
    try {
      const emailContent = employeeWelcomeEmail({
        fullName,
        email: data.email,
        phone: phone ?? "",
        employeeCode,
        tempPassword,
      });
      await sendEmail({
        to: data.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (error) {
      console.error("[Employees] Welcome email failed:", error);
      // Welcome email failure is not critical
    }

    // ── Audit log ──
    await auditLog({
      userId,
      action: "employee.create",
      entityType: "employee",
      entityId: authUser.user.id,
      after: { fullName, email: data.email, phone, employeeCode, centerCode },
      request,
    });

    return created({
      success: true,
      employee: {
        id: authUser.user.id,
        full_name: fullName,
        email: data.email,
        phone,
        role: "employee",
        center_code: centerCode,
      },
      // Return BOTH camelCase (for modal) and snake_case (for backward compat)
      employeeCode,
      tempPassword: data.password ? undefined : tempPassword,
      temp_password: data.password ? undefined : tempPassword,
      message: `${fullName} created as ${employeeCode}. Credentials sent via email.`,
    });
  }

  // ── Fallback: try original camelCase schema (AddEmployeeSchema) ──
  const parsed = AddEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.reduce(
      (acc: Record<string, string[]>, issue) => {
        const field = issue.path.join(".") || "root";
        if (!acc[field]) acc[field] = [];
        acc[field].push(issue.message);
        return acc;
      },
      {} as Record<string, string[]>,
    );
    return validationError(errors);
  }

  const {
    fullName,
    email,
    phone,
    state,
    city,
    idProofType,
    altPhone,
    addressLine1,
    addressLine2,
    pincode,
    bankAccount,
    bankIfsc,
    bankName,
    notes: empNotes,
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
    if (dup.email === email)
      return conflict("An employee with this email already exists.");
    if (dup.phone === phone)
      return conflict("An employee with this phone number already exists.");
  }

  // ── Get admin's center_code ──
  const { data: adminUser } = await supabase
    .from("users")
    .select("center_code")
    .eq("id", userId)
    .single();

  const centerCode =
    (adminUser as { center_code: string } | null)?.center_code ?? "GEN";

  // ── Generate employee code ──
  let employeeCode: string;
  try {
    const { data: seqData, error: seqError } = await supabase.rpc(
      "next_employee_code",
      { p_center: centerCode },
    );
    if (seqError) throw seqError;
    employeeCode = seqData as string;
  } catch {
    employeeCode = `XMP-${centerCode}59${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
  }

  const tempPassword = generatePassword();

  // ── Create auth user ──
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      phone: `+91${phone}`,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: "employee",
        full_name: fullName,
        phone,
        employee_code: employeeCode,
        invited_by: userId,
      },
    });

  if (createError || !newUser.user) {
    console.error("[Admin/Employees POST]:", createError);
    return serverError("Failed to create employee account.");
  }

  const { data: linkedRows, error: linkError } = await supabase
    .from("users")
    .update({
      phone,
      center_code: centerCode,
      role: "employee",
      created_by_admin: userId,
      is_active: true,
    })
    .eq("id", newUser.user.id)
    .select("id");

  if (linkError || !linkedRows || linkedRows.length === 0) {
    console.error(
      "[Admin/Employees POST] Failed to persist created_by_admin link",
      {
        adminId: userId,
        newUserId: newUser.user.id,
        error: linkError,
      },
    );
    await supabase.auth.admin.deleteUser(newUser.user.id).catch(() => {});
    return serverError("Failed to link employee to admin owner.");
  }

  let bankAccountEncrypted: string | null = null;
  let bankIfscEncrypted: string | null = null;

  if (bankAccount) {
    try {
      bankAccountEncrypted = await encrypt(bankAccount);
    } catch {
      // Encryption failure — continue without
    }
  }
  if (bankIfsc) {
    try {
      bankIfscEncrypted = await encrypt(bankIfsc);
    } catch {
      // Encryption failure — continue without
    }
  }

  const { error: profileError } = await supabase
    .from("employee_profiles")
    .insert({
      user_id: newUser.user.id,
      full_name: fullName,
      phone,
      alt_phone: altPhone || null,
      email,
      address_line1: addressLine1 || "",
      address_line2: addressLine2 || null,
      city,
      state,
      pincode: pincode || "",
      id_proof_type: idProofType,
      employee_code: employeeCode,
      status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
      bank_account_encrypted: bankAccountEncrypted,
      bank_ifsc_encrypted: bankIfscEncrypted,
      bank_name: bankName || null,
    });

  if (profileError) {
    console.error("[Employees] Profile insert failed:", profileError);
    await supabase.auth.admin.deleteUser(newUser.user.id).catch(() => {});
    return serverError("Failed to create employee profile.");
  }

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
  } catch (error) {
    console.error("[Employees] Welcome email failed:", error);
    // Welcome email failure is not critical
  }

  await auditLog({
    userId,
    action: "employee.create",
    entityType: "employee",
    entityId: newUser.user.id,
    after: { fullName, email, phone, employeeCode, centerCode },
    request,
  });

  return created({
    success: true,
    employee: {
      id: newUser.user.id,
      full_name: fullName,
      email,
      phone,
      role: "employee",
      center_code: centerCode,
    },
    temp_password: tempPassword,
    employeeCode,
    message: `${fullName} created as ${employeeCode}. Credentials sent via email.`,
  });
});

// ── PATCH /api/admin/employees — Approve / reject / toggle / edit ─────────────
export const PATCH = withAdmin(async (request: NextRequest, { userId }) => {
  const supabase = createAdminClient();
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    string
  >;
  const { employeeId, action, reason, fullName, phone, city, email } = body;

  if (action === "activate_all") {
    const { error } = await supabase
      .from("users")
      .update({ is_active: true })
      .eq("role", "employee")
      .eq("is_active", false);

    if (error) {
      console.error("[activate_all] error:", error);
      return serverError();
    }
    return ok({ message: "Activated all inactive employees." });
  }

  if (!employeeId) return badRequest("EMPLOYEE ID REQUIRED");

  if (action === "resend_verification") {
    if (!email) return badRequest("Email required for verification");
    
    // Generate magiclink / signup link to use as verification through Mailjet
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email,
    });
    
    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("[Resend Verification Error]", linkError);
      return serverError("Failed to generate verification link from Supabase.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verificationUrl = `${appUrl}/auth/verify?token_hash=${linkData.properties.hashed_token}&type=magiclink`;
    
    try {
      const emailContent = verificationEmail({
        fullName: fullName || "Employee",
        verificationUrl,
      });
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      return ok({ message: "Verification link sent successfully." });
    } catch (e) {
      console.error("[Resend Verification Email Delivery Error]", e);
      return serverError("Failed to send verification email.");
    }
  }

  if (action === "delete") {
    // Manually delete profile first to satisfy foreign key constraints
    await supabase.from("employee_profiles").delete().eq("user_id", employeeId);
    
    // Also delete explicitly from users table in case the db cascade is not set
    await supabase.from("users").delete().eq("id", employeeId);
    
    // Auth admin deleteUser will clean up the actual identity
    const { error } = await supabase.auth.admin.deleteUser(employeeId);
    if (error) {
      console.error("[Delete Employee]:", error);
      return serverError("Failed to delete the employee identity.");
    }
    
    return ok({ message: "Employee removed successfully." });
  }

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
    const { data: u } = await supabase
      .from("users")
      .select("is_active")
      .eq("id", employeeId)
      .single();
    const newActive = !(u as { is_active: boolean } | null)?.is_active;
    const { error } = await supabase
      .from("users")
      .update({ is_active: newActive })
      .eq("id", employeeId);
    if (error) return serverError();
    if (!newActive) {
      await supabase.auth.admin
        .updateUserById(employeeId, { ban_duration: "876600h" })
        .catch(() => {});
    } else {
      await supabase.auth.admin
        .updateUserById(employeeId, { ban_duration: "none" })
        .catch(() => {});
    }
    return ok({
      active: newActive,
      message: newActive ? "Employee activated." : "Employee deactivated.",
    });
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
      await supabase
        .from("employee_profiles")
        .update(profileUpdates)
        .eq("user_id", employeeId);
    }
    return ok({ message: "Employee updated." });
  }

  return badRequest("INVALID ACTION");
});

function generatePassword(): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const special = "@#$%&*!";
  const all = lower + upper + digits + special;

  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);

  // Guarantee at least one of each character class
  const pwd = [
    lower[arr[0] % lower.length],
    upper[arr[1] % upper.length],
    digits[arr[2] % digits.length],
    special[arr[3] % special.length],
  ];

  for (let i = 4; i < 12; i++) {
    pwd.push(all[arr[i] % all.length]);
  }

  // Fisher-Yates shuffle (using crypto randomness)
  const shuffleBytes = new Uint8Array(pwd.length);
  crypto.getRandomValues(shuffleBytes);
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }

  return pwd.join("");
}
