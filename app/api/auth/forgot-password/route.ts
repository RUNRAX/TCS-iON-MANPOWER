import { NextRequest, NextResponse } from "next/server";
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

    // Check if the email exists in our users table
    if (!userExists) return badRequest("Email not found in our database. Please check and try again.");

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

    try {
      // Send the email via Resend
      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: "Reset your password - TCS iON Portal",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1025 100%); padding: 40px; color: #fff; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #f97316, #ea580c); line-height: 56px; font-size: 24px;">🔑</div>
            </div>
            <h2 style="color: #f97316; text-align: center; font-size: 22px; margin-bottom: 8px;">Password Reset Request</h2>
            <p style="text-align: center; color: #a0a0a0; font-size: 14px;">We received a request to reset your TCS iON Portal password.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 15px; box-shadow: 0 8px 24px rgba(249,115,22,0.35);">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center;">This link will expire in 60 minutes. If you did not request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
            <p style="color: #555; font-size: 10px; text-align: center; letter-spacing: 1.5px;">TCS iON MANPOWER PORTAL · AES-256 · TLS 1.3</p>
          </div>
        `,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[ForgotPassword] Email delivery failed:", err);
      return NextResponse.json(
        { status: "error", message: errorMsg },
        { status: 500 }
      );
    }

    return ok({ message: "Password reset link sent to your email." });
  } catch (err) {
    console.error("[ForgotPassword] Unexpected:", err);
    return serverError();
  }
}
