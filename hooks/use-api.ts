/**
 * hooks/use-api.ts
 *
 * BRIDGE FILE — DESIGN (direct base44 calls) → FUNCTIONAL (API routes)
 *
 * Typed TanStack Query hooks that:
 *  - Deduplicate requests (single in-flight fetch per query key)
 *  - Cache responses (staleTime prevents redundant re-fetches)
 *  - Provide skeleton-ready loading states matching DESIGN patterns
 *  - Expose typed mutation helpers for write operations
 *
 * All hooks are memoized at the query-client level — components
 * sharing the same queryKey never trigger duplicate network calls.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { adminApi, employeeApi } from "@/lib/apiClient";
import type { AdminStats, EmployeeStats, Employee, ExamShift, ShiftWithAssignment, PaymentRecord } from "@/types/database";

// ── Query Keys (constants to prevent typo-driven cache misses) ───────────────

export const QK = {
  adminStats:          ["admin", "stats"]                        as const,
  adminEmployees:      (p?: object) => ["admin", "employees", p] as const,
  adminShifts:         (p?: object) => ["admin", "shifts", p]    as const,
  adminAssignments:    (p?: object) => ["admin", "assignments", p] as const,
  adminPayments:       (p?: object) => ["admin", "payments", p]  as const,
  adminActivity:       ["admin", "activity"]                     as const,
  adminBroadcastHist:  ["admin", "broadcast", "history"]         as const,
  employeeProfile:     ["employee", "profile"]                   as const,
  employeeShifts:      ["employee", "shifts"]                    as const,
  employeeHistory:     ["employee", "shifts", "history"]         as const,
  employeePayments:    ["employee", "payments"]                  as const,
  employeeNotifs:      ["employee", "notifications"]             as const,
} as const;

// ── Admin hooks ───────────────────────────────────────────────────────────────

/** Admin dashboard stats — 30s stale, auto-refreshes in background */
export function useAdminStats() {
  return useQuery({
    queryKey: QK.adminStats,
    queryFn:  () => adminApi.getStats(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Employee list with pagination + search */
export function useAdminEmployees(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: QK.adminEmployees(params),
    queryFn:  () => adminApi.getEmployees(params),
    staleTime: 20_000,
    placeholderData: (prev) => prev, // keeps old data visible while refetching (no flicker)
  });
}

/** Admin approve/reject employee — invalidates employee list + stats on success */
export function useApproveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, action, reason }: { employeeId: string; action: "approve" | "reject"; reason?: string }) =>
      adminApi.updateEmployee(employeeId, action, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "employees"] });
      void qc.invalidateQueries({ queryKey: QK.adminStats });
    },
  });
}

/** Shift list with optional status filter */
export function useAdminShifts(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: QK.adminShifts(params),
    queryFn:  () => adminApi.getShifts(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

/** Create new employee — full details, sends welcome email */
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createEmployee,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "employees"] });
      void qc.invalidateQueries({ queryKey: QK.adminStats });
    },
  });
}

/** Create shift mutation */
export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createShift,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "shifts"] }); },
  });
}

/** Edit / cancel / complete / publish shift mutation */
export function usePatchShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, action, fields }: { shiftId: string; action: "edit" | "cancel" | "complete" | "publish"; fields?: Record<string, unknown> }) =>
      adminApi.patchShift(shiftId, action, fields),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "shifts"] }); },
  });
}

/** All assignments (admin booking view) */
export function useAdminAssignments(params?: { shiftId?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: QK.adminAssignments(params),
    queryFn:  () => adminApi.getAssignments(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

/** Admin payments list */
export function useAdminPayments(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: QK.adminPayments(params),
    queryFn:  () => adminApi.getPayments(params),
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });
}

/** Clear a payment */
export function useClearPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.clearPayment,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "payments"] }); },
  });
}

/** Recent activity (audit log) */
export function useAdminActivity() {
  return useQuery({
    queryKey: QK.adminActivity,
    queryFn:  () => adminApi.getActivity(),
    staleTime: 20_000,
  });
}

// ── Employee hooks ────────────────────────────────────────────────────────────

/** Employee own profile + stats */
export function useEmployeeProfile() {
  return useQuery({
    queryKey: QK.employeeProfile,
    queryFn:  () => employeeApi.getProfile(),
    staleTime: 60_000,
  });
}

/** Available shifts (with employee's booking status) */
export function useEmployeeShifts() {
  return useQuery({
    queryKey: QK.employeeShifts,
    queryFn:  () => employeeApi.getShifts(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

/** Confirm a shift — optimistic update: mark status instantly, rollback on error */
export function useConfirmShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: string) => employeeApi.confirmShift(shiftId),
    onMutate: async (shiftId: string) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: QK.employeeShifts });
      const prev = qc.getQueryData(QK.employeeShifts);
      // Optimistically update
      qc.setQueryData(QK.employeeShifts, (old: { shifts: ShiftWithAssignment[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          shifts: old.shifts.map(s =>
            s.id === shiftId ? { ...s, myStatus: "pending" as const } : s
          ),
        };
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.employeeShifts, ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.employeeShifts }); },
  });
}

/** Cancel a shift booking */
export function useCancelShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: string) => employeeApi.cancelShift(shiftId),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QK.employeeShifts }); },
  });
}

/** Completed shift history */
export function useEmployeeHistory() {
  return useQuery({
    queryKey: QK.employeeHistory,
    queryFn:  () => employeeApi.getShiftHistory(),
    staleTime: 60_000,
  });
}

/** Employee payment records */
export function useEmployeePayments() {
  return useQuery({
    queryKey: QK.employeePayments,
    queryFn:  () => employeeApi.getPayments(),
    staleTime: 30_000,
  });
}

/** Employee notifications */
export function useEmployeeNotifications({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: QK.employeeNotifs,
    queryFn:  () => employeeApi.getNotifications(),
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : false,
    enabled,
  });
}

/** Mark notification as read — optimistic */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeApi.markNotificationRead(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: QK.employeeNotifs });
      const prev = qc.getQueryData(QK.employeeNotifs);
      qc.setQueryData(QK.employeeNotifs, (old: { notifications: Array<{ id: string; is_read: boolean }> } | undefined) => {
        if (!old) return old;
        return { ...old, notifications: old.notifications.map(n => n.id === id ? { ...n, is_read: true } : n) };
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.employeeNotifs, ctx.prev);
    },
  });
}
