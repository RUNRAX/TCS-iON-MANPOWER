import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/layout/AdminSiteLayout";
import { cache } from "react";

const getUserData = cache(async (userId: string) => {
  const admin = createAdminClient();
  const [userRes, profileRes] = await Promise.all([
    admin.from("users").select("role, is_active").eq("id", userId).single(),
    admin.from("employee_profiles").select("full_name").eq("user_id", userId).maybeSingle(),
  ]);
  return { dbUser: userRes.data, profile: profileRes.data };
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { dbUser, profile } = await getUserData(session.user.id);

  // Hard role guard: only role === "admin" can render admin pages
  if (!dbUser) redirect("/login");
  if (dbUser.role === "super_admin") redirect("/super/dashboard");
  if (dbUser.role !== "admin") redirect("/login");

  const prefetchRoutes = ["/admin/dashboard","/admin/employees","/admin/shifts","/admin/payments","/admin/excel","/admin/broadcast"];

  return (
    <>
      {prefetchRoutes.map(href => (
        <Link key={href} href={href} prefetch={true} style={{ display: "none" }} aria-hidden />
      ))}
      <AdminSiteLayout
        role="admin"
        userId={session.user.id}
        userEmail={session.user.email ?? ""}
        userFullName={profile?.full_name ?? undefined}
      >
        {children}
      </AdminSiteLayout>
    </>
  );
}
