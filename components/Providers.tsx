"use client";
/**
 * components/Providers.tsx — Root client-side provider tree.
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

/**
 * Disable all CSS transitions for the very first frame after hydration.
 * This prevents any flicker caused by React setting classes/styles that
 * differ from what the SSR HTML says — even with suppressHydrationWarning,
 * there can be one repaint before useLayoutEffect corrects things.
 *
 * We add the class before the first paint and remove it after 150ms,
 * which is well within any perceptible animation window.
 */
function HydrationTransitionGuard() {
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("no-transition");
    // rAF ensures the class is applied for at least one full frame
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const id = setTimeout(() => el.classList.remove("no-transition"), 150);
        return () => clearTimeout(id);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HydrationTransitionGuard />
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
