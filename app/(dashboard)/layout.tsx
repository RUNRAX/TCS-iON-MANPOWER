import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SiteLayout from "@/components/layout/SiteLayout";
import { cache } from "react";

// Cache the role+profile lookup for the duration of this request
const getUserData = cache(async (userId: string) => {
  const admin = createAdminClient();
  const [userRes, profileRes] = await Promise.all([
    admin.from("users").select("role, is_active").eq("id", userId).single(),
    admin.from("employee_profiles").select("full_name").eq("user_id", userId).maybeSingle(),
  ]);
  return { dbUser: userRes.data, profile: profileRes.data };
});

/**
 * app/(dashboard)/layout.tsx — Server Component
 *
 * MERGED from FUNCTIONAL/app/(dashboard)/layout.tsx
 *
 * Reads session from cookies (zero network call via getSession),
 * fetches role + name from DB using admin client (bypasses RLS),
 * then renders the DESIGN's SiteLayout client component.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { dbUser } = await getUserData(session.user.id);

  if (dbUser?.is_active === false) redirect("/login?reason=inactive");

  if (dbUser?.role === "super_admin") redirect("/super/dashboard");

  return (
    <>
      {children}
    </>
  );
}
