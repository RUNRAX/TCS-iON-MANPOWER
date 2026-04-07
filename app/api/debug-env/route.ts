import { NextResponse } from "next/server";

export const GET = async () => {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length ?? 0,
    supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15) ?? "null",
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    hasGeminiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
    geminiKeyLength: process.env.GOOGLE_GEMINI_API_KEY?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION ?? "unknown",
  });
};
