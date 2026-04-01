/**
 * lib/apiClient.ts
 *
 * BRIDGE FILE — DESIGN (base44Client) → FUNCTIONAL (Next.js API routes)
 *
 * Replaces DESIGN/src/api/base44Client.js with a typed client
 * that calls the real Next.js API routes from FUNCTIONAL.
 *
 * Route mapping:
 *   DESIGN base44.entities.Employee    → /api/admin/employees
 *   DESIGN base44.entities.Shift       → /api/admin/shifts  |  /api/employee/shifts
 *   DESIGN base44.entities.ShiftBooking → /api/admin/assignments | /api/employee/shifts
 *   DESIGN base44.entities.Notification → /api/admin/notifications | /api/employee/notifications
 */

import type {
  AdminStats,
  EmployeeStats,
  Employee,
  ExamShift,
  ShiftWithAssignment,
  PaymentRecord,
  ApiSuccess,
} from "@/types/database";

// ── Generic fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try { const j = await res.json(); errMsg = j.message ?? errMsg; } catch {}
    throw new Error(errMsg);
  }

  const json = await res.json() as ApiSuccess<T>;
  return json.data;
}

// ── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  /** GET /api/admin/stats — dashboard counters */
  getStats: () =>
    apiFetch<AdminStats>("/api/admin/stats"),

  /** GET /api/admin/employees — paginated employee list */
  getEmployees: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page)   qs.set("page",   String(params.page));
    if (params?.limit)  qs.set("limit",  String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    return apiFetch<{ employees: Employee[]; pagination: { page: number; limit: number; total: number } }>(
      `/api/admin/employees?${qs}`
    );
  },

  /** PATCH /api/admin/employees — approve or reject an employee */
  updateEmployee: (employeeId: string, action: "approve" | "reject", reason?: string) =>
    apiFetch<{ message: string }>("/api/admin/employees", {
      method: "PATCH",
      body: JSON.stringify({ employeeId, action, reason }),
    }),

  /** GET /api/admin/shifts — all shifts with assignment counts */
  getShifts: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page)   qs.set("page",   String(params.page));
    if (params?.limit)  qs.set("limit",  String(params.limit));
    return apiFetch<{ shifts: (ExamShift & { confirmed_count: number; pay_amount: number })[]; pagination: { page: number; limit: number; total: number } }>(
      `/api/admin/shifts?${qs}`
    );
  },

  /** POST /api/admin/shifts — create shift */
  createShift: (data: {
    title: string; examDate: string; shiftNumber: number;
    startTime: string; endTime: string; venue: string;
    venueAddress?: string; maxEmployees: number; minEmployees?: number;
    payAmount?: number; notes?: string;
  }) =>
    apiFetch<{ shift: ExamShift; message: string }>("/api/admin/shifts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** PATCH /api/admin/shifts — edit, cancel, or complete shift */
  patchShift: (shiftId: string, action: "edit" | "cancel" | "complete", fields?: Record<string, unknown>) =>
    apiFetch<{ message: string }>("/api/admin/shifts", {
      method: "PATCH",
      body: JSON.stringify({ shiftId, action, ...fields }),
    }),

  /** GET /api/admin/assignments — all shift assignments (admin view) */
  getAssignments: (params?: { shiftId?: string; status?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.shiftId) qs.set("shiftId", params.shiftId);
    if (params?.status)  qs.set("status",  params.status);
    if (params?.page)    qs.set("page",    String(params.page));
    return apiFetch<{ assignments: unknown[]; pagination: unknown }>(`/api/admin/assignments?${qs}`);
  },

  /** GET /api/admin/payments — all payment records */
  getPayments: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page)   qs.set("page",   String(params.page));
    if (params?.limit)  qs.set("limit",  String(params.limit));
    return apiFetch<{ payments: PaymentRecord[]; pagination: unknown }>(`/api/admin/payments?${qs}`);
  },

  /** POST /api/admin/payments — clear a payment */
  clearPayment: (data: {
    employeeId: string; shiftId: string;
    amount?: number; amountRupees?: number; referenceNumber?: string; notes?: string;
  }) =>
    apiFetch<{ message: string }>("/api/admin/payments", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        // API expects amountRupees — normalise whichever field was passed
        amountRupees: data.amountRupees ?? data.amount,
      }),
    }),

  /** POST /api/admin/broadcast — send WhatsApp broadcast */
  broadcast: (data: { shiftId: string; targetGroup?: string; customMessage?: string }) =>
    apiFetch<{ message: string; sent: number }>("/api/admin/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** GET /api/admin/broadcast/history */
  getBroadcastHistory: () =>
    apiFetch<{ history: unknown[] }>("/api/admin/broadcast/history"),

  /** GET /api/admin/activity — recent audit log */
  getActivity: () =>
    apiFetch<{ activity: unknown[] }>("/api/admin/activity"),

  /** GET /api/admin/notifications — admin broadcast notifications */
  getNotifications: () =>
    apiFetch<{ notifications: unknown[] }>("/api/admin/notifications"),
};

// ── Employee API ─────────────────────────────────────────────────────────────

export const employeeApi = {
  /** GET /api/employee/profile — current employee's profile */
  getProfile: () =>
    apiFetch<{ profile: Employee | null; stats: EmployeeStats }>("/api/employee/profile"),

  /** POST /api/employee/profile — create/update profile */
  upsertProfile: (data: Record<string, unknown>, isUpdate = false) =>
    apiFetch<{ profile: Employee; message: string }>("/api/employee/profile", {
      method: isUpdate ? "PATCH" : "POST",
      body: JSON.stringify(data),
    }),

  /** GET /api/employee/shifts — available shifts for employee */
  getShifts: () =>
    apiFetch<{ shifts: ShiftWithAssignment[] }>("/api/employee/shifts"),

  /** POST /api/employee/shifts — book a shift */
  confirmShift: (shiftId: string) =>
    apiFetch<{ message: string }>("/api/employee/shifts", {
      method: "POST",
      body: JSON.stringify({ shiftId }),
    }),

  /** DELETE /api/employee/shifts — cancel booking */
  cancelShift: (shiftId: string) =>
    apiFetch<{ message: string }>("/api/employee/shifts", {
      method: "DELETE",
      body: JSON.stringify({ shiftId }),
    }),

  /** GET /api/employee/shifts/history — completed shifts */
  getShiftHistory: () =>
    apiFetch<{ history: ShiftWithAssignment[] }>("/api/employee/shifts/history"),

  /** GET /api/employee/payments — payment records */
  getPayments: () =>
    apiFetch<{ payments: PaymentRecord[]; summary: EmployeeStats }>("/api/employee/payments"),

  /** GET /api/employee/notifications */
  getNotifications: () =>
    apiFetch<{ notifications: unknown[] }>("/api/employee/notifications"),

  /** PATCH /api/employee/notifications — mark as read */
  markNotificationRead: (id: string) =>
    apiFetch<{ message: string }>("/api/employee/notifications", {
      method: "PATCH",
      body: JSON.stringify({ id }),
    }),
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: (identifier: string, password: string) =>
    apiFetch<{ redirectTo: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),

  logout: () =>
    apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" }),

  forgotPassword: (identifier: string) =>
    apiFetch<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),
};
