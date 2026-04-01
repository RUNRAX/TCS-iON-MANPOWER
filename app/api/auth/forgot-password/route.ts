import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ok, badRequest, serverError } from "@/lib/utils/api";

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

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${appUrl}/reset-password`,
    });

    if (error) {
      console.error("[ForgotPassword] Error:", error);
      return serverError();
    }

    return ok({ message: "RESET LINK SENT" });
  } catch (err) {
    console.error("[ForgotPassword] Unexpected:", err);
    return serverError();
  }
}
