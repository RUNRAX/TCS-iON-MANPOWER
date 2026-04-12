import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
  if (!session) return redirect("/login");

  const { dbUser } = await getUserData(session.user.id);

  if (!dbUser) redirect("/login");
  if (dbUser.is_active === false) redirect("/login?reason=inactive");

  // super_admin should never render inside the (dashboard) group
  if (dbUser.role === "super_admin") redirect("/super/dashboard");

  // ── Defense-in-depth: pathname-based role assertion ──
  // Even though middleware already blocks these, a second check prevents future
  // middleware bugs from causing an access-control breach.
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? headersList.get("x-next-url") ?? "";
  const userRole = dbUser.role as string;

  if (pathname.startsWith("/super") && userRole !== "super_admin") {
    redirect(userRole === "admin" ? "/admin/dashboard" : "/employee/dashboard");
  }
  if (pathname.startsWith("/admin") && userRole !== "admin" && userRole !== "super_admin") {
    redirect("/employee/dashboard");
  }

  return (
    <>
      {children}
    </>
  );
}
