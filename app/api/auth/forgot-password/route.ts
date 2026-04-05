import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ok, badRequest, serverError } from "@/lib/utils/api";
import { sendEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) return badRequest("VALID EMAIL REQUIRED");

    const supabase = createAdminClient();

    // Check if the email exists in our users table first
    const { data: userExists } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .single();

    // Always return success even if email not found — prevents email enumeration
    if (!userExists) return ok({ message: "IF AN ACCOUNT EXISTS, A RESET LINK WILL BE SENT" });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Generate link properties to bypass Supabase's internal email service
    const { data: linkData, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
    });

    if (error || !linkData.properties?.hashed_token) {
      console.error("[ForgotPassword] Error generating link:", error);
      return serverError();
    }

    // Construct direct app link (avoids .supabase.co DNS)
    const tokenHash = linkData.properties.hashed_token;
    const resetUrl = `${appUrl}/reset-password?token_hash=${tokenHash}&type=recovery`;

    // Send the email via Resend
    await sendEmail({
      to: email.trim().toLowerCase(),
      subject: "Reset your password - TCS iON Portal",
      html: `
        <div style="font-family: sans-serif; background: #0a0a0a; padding: 40px; color: #fff;">
          <h2 style="color: #4F9EFF;">Password Reset Request</h2>
          <p>We received a request to reset your password.</p>
          <p>Click the secure link below to choose a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1a6cff; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 10px; margin-bottom: 20px;">Reset Password</a>
          <p style="color: #888; font-size: 12px;">This link will expire in 60 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return ok({ message: "RESET LINK SENT" });
  } catch (err) {
    console.error("[ForgotPassword] Unexpected:", err);
    return serverError();
  }
}
