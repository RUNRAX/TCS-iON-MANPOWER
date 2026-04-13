import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SuperSiteLayout from "@/components/layout/SuperSiteLayout";
import { Providers } from "@/components/Providers";
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
 * app/(super)/layout.tsx — Server Component
 *
 * Uses SuperSiteLayout identically to admin, but strictly locked to super_admin.
 */
export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  // ✅ getUser() — real Supabase server verification (Layer 2 for super admin)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return redirect("/super/login");

  const { dbUser, profile } = await getUserData(user.id);

  if (!dbUser) redirect("/super/login");
  if (dbUser.is_active === false) redirect("/super/login?reason=inactive");

  // Hard server-side guard: ONLY super_admin role can access /super/* pages
  if (dbUser.role !== "super_admin") {
    redirect(dbUser.role === "admin" ? "/admin/dashboard" : "/employee/dashboard");
  }

  const role = "super_admin";

  const prefetchRoutes = [
    "/super/dashboard",
    "/super/admins",
    "/super/activity",
    "/super/broadcast",
    "/super/reports",
    "/super/settings"
  ];

  // ✅ Pass userId + userRole down so Providers → ThemeProvider can:
  //   1. Namespace sessionStorage per user (tc_{userId}_superadmin)
  //   2. Apply role-based default (orange for super admin on /super routes)
  return (
    <Providers userId={user.id} userRole={role}>
      {prefetchRoutes.map(href => (
        <Link key={href} href={href} prefetch={true} style={{ display: "none" }} aria-hidden />
      ))}
      <SuperSiteLayout
        role={role}
        userId={user.id}
        userEmail={user.email ?? ""}
        userFullName={profile?.full_name ?? undefined}
      >
        {children}
      </SuperSiteLayout>
    </Providers>
  );
}
