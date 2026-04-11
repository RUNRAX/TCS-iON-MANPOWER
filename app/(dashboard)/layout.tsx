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

  const { dbUser, profile } = await getUserData(session.user.id);

  if (dbUser?.is_active === false) redirect("/login?reason=inactive");

  // ── CRITICAL: Super admins must NEVER land in the (dashboard) layout ──
  // They have their own dedicated (super) layout with superAdminNav.
  // If a super_admin somehow hits /admin/*, redirect them to their own panel.
  if (dbUser?.role === "super_admin") redirect("/super/dashboard");

  // Normalize role to admin | employee only (super_admin is handled above)
  const role = (dbUser?.role === "admin" ? "admin" : "employee") as "admin" | "employee";

  // Role is synced into app_metadata during login (server-side only).
  // No client-side sync needed — app_metadata cannot be modified by the client.

  // Prefetch all dashboard routes so navigations are instant after first load
  const prefetchRoutes =
    role === "admin"
      ? ["/admin/dashboard","/admin/employees","/admin/shifts","/admin/payments","/admin/excel","/admin/broadcast"]
      : ["/employee/dashboard","/employee/shifts","/employee/history","/employee/profile","/employee/payments"];

  return (
    <>
      {prefetchRoutes.map(href => (
        <Link key={href} href={href} prefetch={true} style={{ display: "none" }} aria-hidden />
      ))}
      <SiteLayout
        role={role}
        userId={session.user.id}
        userEmail={session.user.email ?? ""}
        userFullName={profile?.full_name ?? undefined}
      >
        {children}
      </SiteLayout>
    </>
  );
}
