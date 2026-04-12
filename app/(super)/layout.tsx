import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SuperSiteLayout from "@/components/layout/SuperSiteLayout";
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  const { dbUser, profile } = await getUserData(session.user.id);

  if (!dbUser) redirect("/login");
  if (dbUser.is_active === false) redirect("/login?reason=inactive");

  // Hard server-side guard: ONLY super_admin role can access /super/* pages
  if (dbUser.role !== "super_admin") {
    redirect(dbUser.role === "admin" ? "/admin/dashboard" : "/login");
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

  return (
    <>
      {prefetchRoutes.map(href => (
        <Link key={href} href={href} prefetch={true} style={{ display: "none" }} aria-hidden />
      ))}
      <SuperSiteLayout
        role={role}
        userId={session.user.id}
        userEmail={session.user.email ?? ""}
        userFullName={profile?.full_name ?? undefined}
      >
        {children}
      </SuperSiteLayout>
    </>
  );
}
