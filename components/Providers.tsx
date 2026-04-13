"use client";
/**
 * components/Providers.tsx — Root client-side provider tree.
 *
 * Accepts optional userId & userRole so ThemeProvider can:
 *   1. Namespace sessionStorage per user (isolates theme between accounts)
 *   2. Apply role-based defaults (super_admin → red on /super routes)
 */

import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { Toaster } from "sonner";
import NavigationProgress from "@/components/NavigationProgress";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            60_000,     // 1 minute
      gcTime:               15 * 60_000, // 15 minutes
      retry:                1,
      retryDelay:           500,
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
      refetchOnMount:       true,
      networkMode:          "offlineFirst",
    },
  },
});



export function Providers({
  children,
  userId,
  userRole,
}: {
  children: React.ReactNode;
  userId?: string | null;
  userRole?: string | null;
}) {
  return (
    <ThemeProvider userId={userId} userRole={userRole}>
      <QueryClientProvider client={queryClient}>
        {children}
        <NavigationProgress />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: 13,
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
