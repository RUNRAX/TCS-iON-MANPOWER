import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ message: "Logged out" }, { status: 200 });
}
