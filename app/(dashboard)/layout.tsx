// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Providers } from "@/components/Providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // ✅ getUser() — makes a real network call to Supabase auth server
  // This CANNOT be bypassed with a forged JWT — Supabase validates server-side
  // This is Layer 2: runs even if middleware was somehow bypassed
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // No valid user → boot to login, no exceptions
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? 
                   headersList.get("x-pathname") ??
                   headersList.get("x-next-url") ?? "";

  if (error || !user) {
    if (pathname.startsWith("/admin")) redirect("/admin/login");
    if (pathname.startsWith("/employee")) redirect("/employee/login");
    redirect("/404");
  }

  const role = (user.app_metadata?.role as string) ?? "employee";


  // ✅ Independent role enforcement — does NOT trust middleware
  // super_admin must only use /super/*
  if (
    role === "super_admin" &&
    (pathname.startsWith("/admin") || pathname.startsWith("/employee"))
  ) {
    redirect("/super/dashboard");
  }

  // admin/employee must NOT access /super/*
  if (pathname.startsWith("/super") && role !== "super_admin") {
    redirect(
      role === "admin" ? "/admin/dashboard" : "/employee/dashboard"
    );
  }

  // employee must NOT access /admin/*
  if (
    pathname.startsWith("/admin") &&
    role !== "admin" &&
    role !== "super_admin"
  ) {
    redirect("/employee/dashboard");
  }

  // admin must NOT access /employee/* pages
  if (
    pathname.startsWith("/employee") &&
    (role === "admin" || role === "super_admin")
  ) {
    redirect("/admin/dashboard");
  }

  // ✅ Pass userId + userRole down so Providers → ThemeProvider can:
  //   1. Namespace sessionStorage per user (isolates theme between accounts)
  //   2. Apply role-based default (orange for admin/employee routes)
  return (
    <Providers userId={user.id} userRole={role}>
      {children}
    </Providers>
  );
}
