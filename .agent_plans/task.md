# Task Checklist — Report-an-Issue + Smooth Scroll Overhaul

## Task 1: Fix "Report an Issue" → Reliable Email with Rich Template
- [x] Update `components/FeedbackHelpButton.tsx` — rebuild mailto with rich structured template (subject with role+date, body with issue sections + auto-captured diagnostics), switch from `window.open` to `window.location.href`
- [x] Update `app/page.tsx` — apply same improved mailto pattern in footer "Report an Issue" button

## Task 2: Implement Lenis Smooth Scrolling — Premium Smoothness
- [x] Install `lenis` npm package
- [x] Create `components/SmoothScrollProvider.tsx` — Lenis provider with context, raf loop, reduced-motion respect
- [x] Update `components/Providers.tsx` — wrap children with SmoothScrollProvider
- [x] Update `components/layout/SuperSiteLayout.tsx` — integrate Lenis on `<main>` scroll container
- [x] Update `components/layout/AdminSiteLayout.tsx` — integrate Lenis on `<main>` scroll container
- [x] Update `components/layout/EmployeeSiteLayout.tsx` — integrate Lenis on `<main>` scroll container
- [x] Update `app/globals.css` — remove `scroll-behavior: smooth`, add scroll container perf hints
- [x] Verify `app/page.tsx` — ensure Framer Motion `useScroll` still works with Lenis window scroll
