# Changelog

All notable changes to the TCS iON Manpower Portal are documented here.

---

## [Grama Sanjeevini] — v1.0.0 — 2026-05-15

> **Grama Sanjeevini** is the inaugural production release of the TCS iON Manpower Portal — a full-stack workforce management system built on Next.js 14, Supabase, and Tailwind CSS.

### ✨ Features

#### Authentication & Security
- Cookie-based JWT authentication with zero-network-round-trip session reads
- Role-based access control (Admin / Employee)
- Rate limiting per IP: 30/min (auth), 120/min (employee), 300/min (admin)
- Security headers on all routes: `X-Frame-Options`, CSP, HSTS, Referrer-Policy
- AES-256 application-layer encryption for bank details before Supabase storage
- Row-Level Security (RLS) enforced on all Supabase tables
- Zod validation on every API route input
- Audit logging on all admin mutations

#### Admin Panel
- Dashboard with live statistics
- Employee management (create, view, update, deactivate)
- Shift scheduling and assignment
- Payment tracking and history
- Excel export for reports
- Broadcast messaging to employees
- Activity feed and audit trail

#### Employee Portal
- Personal dashboard with upcoming shifts
- Shift confirmation with optimistic UI updates
- Booking / shift history
- Profile management
- Payment history
- Real-time notifications (WhatsApp + in-app)

#### Infrastructure
- Next.js 14 App Router with server components for fast TTFB
- TanStack Query with 20-second stale time and optimistic updates
- Supabase Postgres with 7 schema migrations
- Upstash Redis for rate limiting
- WhatsApp Cloud API (Meta) webhook integration
- Sentry error monitoring (server, edge, and browser)
- Vercel deployment configuration

### 🗄️ Database Migrations Included
| Migration | Description |
|---|---|
| `001_initial_schema.sql` | Core tables: users, employees, shifts, assignments, payments |
| `003_phase3_shifts_broadcast.sql` | Broadcast messages, shift phases |
| `004_duty_role.sql` | Duty roles and assignments |
| `005_center_employee_id.sql` | Center-scoped employee IDs |
| `006_fix_table_alias.sql` | Query alias fixes |
| `20260414000001_add_user_notes.sql` | Admin notes on user profiles |
| `20260416000001_add_email_verified.sql` | Email verification flag |

### 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + RLS)
- **Styling**: Tailwind CSS + Radix UI + shadcn/ui
- **3D Background**: Three.js / React Three Fiber
- **Animation**: Framer Motion + GSAP
- **State / Data**: TanStack Query + Zustand
- **Notifications**: WhatsApp Cloud API (Meta)
- **Monitoring**: Sentry
- **Deployment**: Vercel

---

_Named after the **Grama Sanjeevini** programme — bringing essential services to every doorstep._
