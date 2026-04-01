# TCS iON Staff Portal — Merged Production Build

> **DESIGN (Vite/React/JS)** + **FUNCTIONAL (Next.js/TypeScript)** → Single Production-Ready Next.js 14 App

---

## 📁 Project Structure

```
tcsion-portal/
├── app/
│   ├── layout.tsx                    ← Root layout (fonts + Providers)
│   ├── globals.css                   ← MERGED: DESIGN animations + FUNCTIONAL resets
│   ├── page.tsx                      ← PUBLIC: DESIGN Home.jsx → TSX (landing page)
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx            ← FUNCTIONAL login (untouched)
│   │   ├── register/page.tsx         ← FUNCTIONAL register
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                ← SERVER COMPONENT: auth guard → passes user to SiteLayout
│   │   ├── admin/
│   │   │   ├── dashboard/page.tsx    ← BRIDGE: DESIGN AdminDashboard + FUNCTIONAL /api/admin/stats
│   │   │   ├── employees/page.tsx    ← BRIDGE: DESIGN AdminEmployees + FUNCTIONAL /api/admin/employees
│   │   │   ├── shifts/page.tsx       ← BRIDGE: DESIGN AdminShifts + FUNCTIONAL /api/admin/shifts
│   │   │   ├── payments/page.tsx     ← BRIDGE: DESIGN AdminBookings + FUNCTIONAL /api/admin/payments
│   │   │   ├── excel/page.tsx        ← FUNCTIONAL-only (Excel export, no DESIGN counterpart)
│   │   │   └── broadcast/page.tsx    ← FUNCTIONAL-only + design shell applied
│   │   └── employee/
│   │       ├── dashboard/page.tsx    ← BRIDGE: DESIGN EmployeeDashboard + FUNCTIONAL hooks
│   │       ├── shifts/page.tsx       ← BRIDGE: DESIGN EmployeeShifts + FUNCTIONAL /api/employee/shifts
│   │       ├── history/page.tsx      ← BRIDGE: DESIGN EmployeeBookings + history API
│   │       ├── profile/page.tsx      ← BRIDGE: DESIGN EmployeeProfile + FUNCTIONAL /api/employee/profile
│   │       └── payments/page.tsx     ← FUNCTIONAL-only
│   │
│   └── api/                          ← ALL FUNCTIONAL API ROUTES (unchanged)
│       ├── auth/{login,logout,forgot-password,change-password}/route.ts
│       ├── admin/{stats,employees,shifts,payments,assignments,notifications,broadcast,activity}/route.ts
│       ├── employee/{profile,shifts,shifts/history,payments,notifications}/route.ts
│       ├── health/route.ts
│       └── webhooks/whatsapp/route.ts
│
├── components/
│   ├── Providers.tsx                 ← BRIDGE: ThemeProvider + QueryClientProvider + Toaster
│   └── layout/
│       └── SiteLayout.tsx            ← BRIDGE: DESIGN Layout.jsx → TSX (SceneBackground, NavItem, sidebar)
│
├── hooks/
│   └── use-api.ts                    ← BRIDGE: All TanStack Query hooks (replaces base44 direct calls)
│
├── lib/
│   ├── apiClient.ts                  ← BRIDGE: Typed fetch client (replaces base44Client.js)
│   ├── context/
│   │   └── ThemeContext.tsx          ← BRIDGE: DESIGN ThemeContext.jsx → TypeScript
│   ├── auth/middleware.ts            ← FUNCTIONAL (unchanged)
│   ├── supabase/{client,server}.ts   ← FUNCTIONAL (unchanged)
│   ├── utils/api.ts                  ← FUNCTIONAL (unchanged)
│   ├── utils/encryption.ts           ← FUNCTIONAL (unchanged)
│   ├── validations/schemas.ts        ← FUNCTIONAL (unchanged)
│   ├── whatsapp/service.ts           ← FUNCTIONAL (unchanged)
│   └── ratelimit.ts                  ← FUNCTIONAL (unchanged)
│
├── types/
│   └── database.ts                   ← FUNCTIONAL + extended API response types
│
├── middleware.ts                     ← FUNCTIONAL (cookie-based auth, rate limiting, security headers)
├── supabase/migrations/              ← FUNCTIONAL SQL migrations
├── next.config.js                    ← MERGED (framer-motion transpile + security headers)
├── tailwind.config.ts                ← MERGED (DESIGN animations + FUNCTIONAL shadcn vars)
├── package.json                      ← MERGED (all deps from both repos, deduped)
└── .env.local                        ← FUNCTIONAL env vars (copy and fill in)
```

---

## 🌉 Bridge Files Explained

| Bridge File | From | To | What Changed |
|---|---|---|---|
| `lib/context/ThemeContext.tsx` | `DESIGN/src/lib/ThemeContext.jsx` | TypeScript | Added interfaces, typed `useTheme()` return, `"use client"` directive |
| `lib/apiClient.ts` | `DESIGN/src/api/base44Client.js` | Typed fetch client | All `base44.entities.X` calls → typed `/api/*` fetch calls |
| `hooks/use-api.ts` | `DESIGN` direct `useEffect` fetches | TanStack Query hooks | Deduplication, staleTime, optimistic updates, cache invalidation |
| `components/Providers.tsx` | `DESIGN/src/main.jsx` providers | Next.js client boundary | `QueryClientProvider` + `ThemeProvider` + `Toaster` as `"use client"` leaf |
| `components/layout/SiteLayout.tsx` | `DESIGN/src/Layout.jsx` | TSX + Next.js | `useNavigate` → `useRouter`, `Link` (react-router) → `Link` (next/link), base44 notif fetch → `useEmployeeNotifications()` |
| `app/(dashboard)/layout.tsx` | `FUNCTIONAL/app/(dashboard)/layout.tsx` | Passes user to SiteLayout | Fetches role + name server-side, renders DESIGN's `SiteLayout` |
| `app/page.tsx` | `DESIGN/src/pages/Home.jsx` | TSX + Next.js | Demo login removed → real `/login` route, `createPageUrl` → real hrefs |
| `app/globals.css` | Both | Merged | DESIGN animations + FUNCTIONAL Tailwind base + CSS vars |

---

## 🚀 Route Mapping

| DESIGN Route | Next.js Route | Notes |
|---|---|---|
| `/Home` (mainPage) | `/` | Public landing page |
| `/EmployeeRegister` | `/register` | Auth flow |
| `/AdminDashboard` | `/admin/dashboard` | |
| `/AdminEmployees` | `/admin/employees` | |
| `/AdminShifts` | `/admin/shifts` | |
| `/AdminBookings` | `/admin/payments` | DESIGN "bookings" ≈ FUNCTIONAL "assignments" |
| `/AdminReports` | `/admin/excel` | FUNCTIONAL Excel export page |
| *(no counterpart)* | `/admin/broadcast` | FUNCTIONAL-only — design shell applied |
| `/EmployeeDashboard` | `/employee/dashboard` | |
| `/EmployeeShifts` | `/employee/shifts` | |
| `/EmployeeBookings` | `/employee/history` | |
| `/EmployeeProfile` | `/employee/profile` | |
| *(no counterpart)* | `/employee/payments` | FUNCTIONAL-only |

---

## ⚡ Performance Decisions

### TTFB
- `app/(dashboard)/layout.tsx` is a **Server Component** — auth check + DB role fetch happen on the server before hydration
- `getSession()` reads from cookie (zero network round-trip to Supabase Auth)
- Role is synced into JWT `user_metadata` so subsequent requests read it from the cookie — no DB lookup

### Re-render Prevention
- `SceneBackground` canvas wrapped in `React.memo` — never re-renders on parent state changes
- `NavItem` wrapped in `React.memo` — only re-renders when `active` prop changes
- `useMemo` used for stat cards and shift lists in all dashboard pages

### Data Fetching
- TanStack Query default `staleTime: 20s` — prevents re-fetching on tab focus or component remount
- `placeholderData: (prev) => prev` on paginated queries — old data stays visible during page transitions (no flash)
- `refetchInterval: 30s` on live data (employee shifts, notifications) for near-real-time feel

### Optimistic Updates
- `useConfirmShift()` — shift status updates instantly in the UI, rolls back on API error
- `useMarkNotificationRead()` — notification dot disappears instantly, rolls back on error

### Tree Shaking
- All DESIGN `.jsx` → `.tsx`, removing the 57kb `base44Client.js` entirely
- `framer-motion` is `transpilePackages` in `next.config.js` — webpack can tree-shake it properly

---

## 🛠 Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your Supabase + WhatsApp credentials
cp .env.local .env.local.mine   # rename and edit

# 3. Run database migrations
npm run db:push

# 4. Start dev server
npm run dev
```

### Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=          # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role key (server-only)
NEXT_PUBLIC_APP_URL=               # Your app URL (http://localhost:3000 for dev)
RESEND_API_KEY=                    # For email (password reset etc.)
META_WHATSAPP_TOKEN=               # Meta WhatsApp Cloud API token
META_WHATSAPP_PHONE_ID=            # WhatsApp phone number ID
META_WHATSAPP_VERIFY_TOKEN=        # Webhook verification token
ENCRYPTION_KEY=                    # 64-char hex (bank details encryption)
SEARCH_HASH_SALT=                  # Random string for search hashing
```

---

## 🔒 Security (inherited from FUNCTIONAL)

- **Middleware**: Cookie-based JWT auth (no network call), rate limiting per IP (30/min auth, 120/min employee, 300/min admin)
- **Security headers** on all routes: `X-Frame-Options: DENY`, CSP, HSTS, Referrer-Policy
- **Bank details** encrypted at application layer (AES-256) before storing in Supabase
- **RLS** enforced on all Supabase tables (admin client bypasses via service role)
- **Zod** validation on all API route inputs
- **Audit logging** on all admin mutations
