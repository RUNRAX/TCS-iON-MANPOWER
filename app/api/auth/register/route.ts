/**
 * POST /api/auth/register
 * Server-side employee registration with rate limiting and Zod validation.
 * Handles multipart form data for photo/ID uploads.
 */
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/ratelimit";
import { ok, badRequest, conflict, serverError } from "@/lib/utils/api";
import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;
const ifscRegex  = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const pincodeRegex = /^\d{6}$/;

const RegisterSchema = z.object({
  fullName: z.string().min(2).max(100).regex(/^[a-zA-Z\s.'-]+$/),
  email: z.string().email().max(255).toLowerCase().optional(),
  phone: z.string().regex(phoneRegex),
  altPhone: z.string().regex(phoneRegex).optional().or(z.literal("")),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(pincodeRegex),
  bankAccount: z.string().min(9).max(18).regex(/^\d+$/).optional().or(z.literal("")),
  bankIfsc: z.string().regex(ifscRegex).toUpperCase().optional().or(z.literal("")),
  bankName: z.string().min(2).max(100).optional().or(z.literal("")),
  idProofType: z.enum(["aadhaar", "pan", "voter_id", "passport"]),
});

export async function POST(request: NextRequest) {
  // Rate limit
  const limited = await rateLimit(request, "/api/auth");
  if (limited) return limited;

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const body: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") body[key] = value;
    }

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid registration data";
      return badRequest(firstError);
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    // Generate a temporary password for the user
    const tempPassword = generateTempPassword();

    // Use phone as login identifier; email is optional for employees
    const loginEmail = data.email || `${data.phone}@emp.tcsion.local`;

    // Check uniqueness
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${loginEmail},phone.eq.${data.phone}`)
      .limit(1);

    if (existing && existing.length > 0) {
      return conflict("An account with this phone number or email already exists.");
    }

    // Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: loginEmail,
      phone: `+91${data.phone}`,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: "employee", full_name: data.fullName, phone: data.phone },
    });

    if (createError || !newUser.user) {
      console.error("[Register] Auth user creation failed:", createError);
      if (createError?.message?.includes("already been registered")) {
        return conflict("An account with this email or phone already exists.");
      }
      return serverError("Registration failed. Please try again.");
    }

    // Write role to app_metadata (server-only, not client-writable)
    await supabase.auth.admin.updateUserById(newUser.user.id, {
      app_metadata: { role: "employee" },
    }).catch(() => {});

    // Insert into users table
    const { error: usersError } = await supabase.from("users").insert({
      id: newUser.user.id,
      email: loginEmail,
      phone: data.phone,
      role: "employee",
    });
    if (usersError) console.error("[Register] Users insert failed:", usersError);

    // Encrypt bank details if provided
    let bankAccountEncrypted: string | null = null;
    let bankIfscEncrypted: string | null = null;

    if (data.bankAccount) {
      try {
        const { encrypt } = await import("@/lib/utils/encryption");
        bankAccountEncrypted = await encrypt(data.bankAccount);
      } catch (e) {
        console.warn("[Register] Bank encryption failed:", e);
      }
    }
    if (data.bankIfsc) {
      try {
        const { encrypt } = await import("@/lib/utils/encryption");
        bankIfscEncrypted = await encrypt(data.bankIfsc);
      } catch (e) {
        console.warn("[Register] IFSC encryption failed:", e);
      }
    }

    // Create employee profile (pending admin approval)
    const { error: profileError } = await supabase.from("employee_profiles").insert({
      user_id:       newUser.user.id,
      full_name:     data.fullName,
      phone:         data.phone,
      alt_phone:     data.altPhone || null,
      email:         loginEmail,
      address_line1: data.addressLine1,
      address_line2: data.addressLine2 || null,
      city:          data.city,
      state:         data.state,
      pincode:       data.pincode,
      id_proof_type: data.idProofType,
      status:        "pending",  // Requires admin approval
      bank_account_encrypted: bankAccountEncrypted,
      bank_ifsc_encrypted:    bankIfscEncrypted,
      bank_name:              data.bankName || null,
    });
    if (profileError) console.error("[Register] Profile insert failed:", profileError);

    // Handle file uploads (photo and ID proof)
    const photoFile = formData.get("photoFile") as File | null;
    const idProofFile = formData.get("idProofFile") as File | null;

    if (photoFile && photoFile.size > 0) {
      try {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `photos/${newUser.user.id}/photo.${ext}`;
        const buffer = Buffer.from(await photoFile.arrayBuffer());
        await supabase.storage.from("employee-docs").upload(path, buffer, {
          contentType: photoFile.type,
          upsert: true,
        });
        const { data: urlData } = supabase.storage.from("employee-docs").getPublicUrl(path);
        if (urlData?.publicUrl) {
          await supabase.from("employee_profiles")
            .update({ photo_url: urlData.publicUrl })
            .eq("user_id", newUser.user.id);
        }
      } catch (e) {
        console.warn("[Register] Photo upload failed:", e);
      }
    }

    if (idProofFile && idProofFile.size > 0) {
      try {
        const ext = idProofFile.name.split(".").pop() ?? "pdf";
        const path = `id-proofs/${newUser.user.id}/id-proof.${ext}`;
        const buffer = Buffer.from(await idProofFile.arrayBuffer());
        await supabase.storage.from("employee-docs").upload(path, buffer, {
          contentType: idProofFile.type,
          upsert: true,
        });
      } catch (e) {
        console.warn("[Register] ID proof upload failed:", e);
      }
    }

    return ok({ message: "Registration successful. Please wait for admin verification." });

  } catch (err) {
    console.error("[Register] Unexpected error:", err);
    return serverError("Registration failed. Please try again.");
  }
}

function generateTempPassword(): string {
  const lower  = "abcdefghjkmnpqrstuvwxyz";
  const upper  = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const special = "@#$%&*!";
  const all = lower + upper + digits + special;

  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);

  const pwd = [
    lower[arr[0] % lower.length],
    upper[arr[1] % upper.length],
    digits[arr[2] % digits.length],
    special[arr[3] % special.length],
  ];

  for (let i = 4; i < 10; i++) {
    pwd.push(all[arr[i] % all.length]);
  }

  // Shuffle
  const shuffleBytes = new Uint8Array(pwd.length);
  crypto.getRandomValues(shuffleBytes);
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }

  return pwd.join("");
}
