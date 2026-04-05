/**
 * /api/employee/profile
 * GET  — Get own profile
 * POST — Submit KYC profile with encrypted bank details + file uploads
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/ratelimit";
import { withEmployee, ok, created, serverError, badRequest, auditLog } from "@/lib/utils/api";
import { EmployeeProfileSchema } from "@/lib/validations/schemas";
import { encrypt } from "@/lib/utils/encryption";

export const GET = withEmployee(async (_req, { userId }) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("employee_profiles")
    .select("id,full_name,phone,alt_phone,email,address_line1,address_line2,city,state,pincode,bank_name,id_proof_type,photo_url,status,rejection_reason,created_at")
    .eq("user_id", userId).eq("is_deleted", false).maybeSingle();
  // Get stats
  const [ { data: shifts }, { data: payments } ] = await Promise.all([
    supabase.from("shift_assignments").select("status, exam_shifts(pay_amount)").eq("employee_id", userId),
    supabase.from("payment_records").select("amount, status").eq("employee_id", userId)
  ]);

  let totalShiftsDone = 0;
  let upcomingShifts = 0;
  let totalEarnings = 0;
  let pendingPayment = 0;
  let clearedPayment = 0;

  if (shifts) {
    totalShiftsDone = shifts.filter(s => s.status === "completed").length;
    upcomingShifts = shifts.filter(s => s.status === "confirmed").length;
  }

  if (payments) {
    payments.forEach(p => {
      const amt = Number(p.amount) || 0;
      if (p.status === "cleared") {
        totalEarnings += amt;
        clearedPayment += amt;
      } else if (p.status === "pending") {
        pendingPayment += amt;
      }
    });
  }

  return ok({
    profile: data ?? null,
    stats: { totalShiftsDone, upcomingShifts, totalEarnings, pendingPayment, clearedPayment }
  });
});

export const POST = withEmployee(async (request, { userId }) => {
  const limited = await rateLimit(request, "employee");
  if (limited) return limited;
  const supabase = createAdminClient();

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return badRequest("Invalid form data"); }

  const raw = Object.fromEntries(Array.from(formData.entries()).filter(([,v]) => typeof v === "string")) as Record<string,string>;
  const parsed = EmployeeProfileSchema.safeParse(raw);
  if (!parsed.success) return badRequest(parsed.error.issues.map(i=>i.message).join(", "));

  const input = parsed.data;
  const photoFile   = formData.get("photoFile")   as File|null;
  const idProofFile = formData.get("idProofFile") as File|null;

  let photoUrl: string|null = null;
  let idProofUrl: string|null = null;

  if (photoFile?.size) {
    if (photoFile.size > 2*1024*1024) return badRequest("Photo must be under 2MB");
    const buf = await photoFile.arrayBuffer();
    const ext = photoFile.type.split("/")[1] ?? "jpg";
    const { error } = await supabase.storage.from("employee-documents").upload(`profiles/${userId}/photo.${ext}`, buf, { contentType: photoFile.type, upsert: true });
    if (!error) photoUrl = `profiles/${userId}/photo.${ext}`;
  }

  if (idProofFile?.size) {
    if (idProofFile.size > 5*1024*1024) return badRequest("ID proof must be under 5MB");
    const buf = await idProofFile.arrayBuffer();
    const ext = idProofFile.type === "application/pdf" ? "pdf" : idProofFile.type.split("/")[1] ?? "jpg";
    const { error } = await supabase.storage.from("employee-documents").upload(`profiles/${userId}/id_proof.${ext}`, buf, { contentType: idProofFile.type, upsert: true });
    if (!error) idProofUrl = `profiles/${userId}/id_proof.${ext}`;
  }

  let bankAccountEncrypted: string|null = null;
  let bankIfscEncrypted: string|null = null;
  try {
    bankAccountEncrypted = await encrypt(input.bankAccount);
    bankIfscEncrypted    = await encrypt(input.bankIfsc);
  } catch { return serverError("Failed to secure bank details"); }

  const profileData = {
    user_id: userId, full_name: input.fullName, phone: input.phone,
    alt_phone: input.altPhone || null, email: input.email,
    address_line1: input.addressLine1, address_line2: input.addressLine2 || null,
    city: input.city, state: input.state, pincode: input.pincode,
    bank_account_encrypted: bankAccountEncrypted, bank_ifsc_encrypted: bankIfscEncrypted,
    bank_name: input.bankName, id_proof_type: input.idProofType,
    ...(photoUrl && { photo_url: photoUrl }),
    ...(idProofUrl && { id_proof_url: idProofUrl }),
    status: "pending" as const,
  };

  const { data: existing } = await supabase.from("employee_profiles").select("id").eq("user_id", userId).maybeSingle();
  let profileId: string|undefined;

  if (existing?.id) {
    const { data, error } = await supabase.from("employee_profiles").update(profileData).eq("user_id", userId).select("id").single();
    if (error) return serverError();
    profileId = data?.id;
  } else {
    const { data, error } = await supabase.from("employee_profiles").insert(profileData).select("id").single();
    if (error) return serverError();
    profileId = data?.id;
  }

  await auditLog({ userId, action: "profile.submit", entityType: "employee_profile", entityId: profileId, after: { status: "pending" }, request });
  return created({ message: "Profile submitted. Awaiting admin approval." });
});
