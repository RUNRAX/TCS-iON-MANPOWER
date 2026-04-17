import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as any;
  const next = url.searchParams.get("next") ?? "/employee/login";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/employee/login?error=invalid_link", request.url));
  }

  const supabase = createAdminClient();

  // Exchange the token for a session
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error || !data?.user) {
    console.error("[Auth/Verify] Error verifying OTP:", error);
    return NextResponse.redirect(new URL("/employee/login?error=verification_failed", request.url));
  }

  // Ensure email_verified flag is set on our users table
  await supabase
    .from("users")
    .update({ email_verified: true })
    .eq("id", data.user.id);

  // Successfully verified — redirect to login (or dashboard if session persists)
  return NextResponse.redirect(new URL(`${next}?verified=true`, request.url));
}
