"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAdminEmployees, useApproveEmployee } from "@/hooks/use-api";
import { Users, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight, UserX, Save, Edit3, Trash2, Phone, MapPin, CalendarDays, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import CreateEmployeeModal from "@/components/admin/CreateEmployeeModal";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

// Inline debounce — avoids lodash import just for this
function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function AdminEmployees() {
  const { theme: t, dark } = useTheme();
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const cardBg    = dark ? "rgba(12,10,28,0.48)" : "rgba(255,255,255,0.58)";
  const border    = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const [rawSearch, setRawSearch] = useState("");
  const [status, setStatus]       = useState<StatusFilter>("all");
  const [page, setPage]           = useState(1);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [selectedEmpDetail, setSelectedEmpDetail] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", city: "" });

  const qc = useQueryClient();

  const { mutate: editEmployee, isPending: editing } = useMutation({
    mutationFn: async (data: { employeeId: string; fullName: string; phone: string; city: string }) => {
      const res = await fetch("/api/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", ...data }),
      });
      if (!res.ok) throw new Error("Failed to update employee");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Employee updated successfully");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
    onError: () => toast.error("Failed to update employee")
  });

  const { mutate: deleteEmployee, isPending: deleting } = useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await fetch("/api/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", employeeId }),
      });
      if (!res.ok) throw new Error("Failed to remove employee");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Employee removed successfully");
      setSelectedEmpDetail(null);
      qc.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
    onError: () => toast.error("Failed to remove employee")
  });

  // Debounce search so we don't fire on every keystroke
  const search = useDebounce(rawSearch, 350);

  const { data, isLoading, isFetching } = useAdminEmployees({
    page, limit: 20,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const { mutate: approveEmployee, isPending: approving } = useApproveEmployee();

  // API now returns snake_case: full_name, city, state, etc.
  const employees = (data as { employees?: Array<{
    id: string; email: string; phone: string | null; is_active: boolean;
    full_name: string | null; city: string | null; state: string | null;
    status: string; rejection_reason: string | null; joined_at: string; profile_id: string | null;
  }> } | undefined)?.employees ?? [];
  const pagination = (data as { pagination?: { page: number; limit: number; total: number; totalPages: number } } | undefined)?.pagination;

  const handleAction = useCallback((employeeId: string, action: "approve" | "reject") => {
    if (action === "reject" && rejectReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }
    approveEmployee(
      { employeeId, action, reason: action === "reject" ? rejectReason : undefined },
      {
        onSuccess: () => {
          toast.success(action === "approve" ? "Employee approved ✓" : "Employee rejected");
          setSelectedEmp(null);
          setRejectReason("");
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }, [approveEmployee, rejectReason]);

  const statusColor = (s: string) => ({
    approved:   { bg: "rgba(16,185,129,0.15)",  fg: "#34d399" },
    pending:    { bg: "rgba(245,158,11,0.15)",  fg: "#fbbf24" },
    rejected:   { bg: "rgba(239,68,68,0.15)",   fg: "#f87171" },
    no_profile: { bg: "rgba(100,100,120,0.15)", fg: "#94a3b8" },
    inactive:   { bg: "rgba(100,100,120,0.15)", fg: "#94a3b8" },
  }[s] ?? { bg: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`, fg: "var(--tc-primary)" });

  const tabs: StatusFilter[] = ["all", "pending", "approved", "rejected"];
  const initials = (name: string | null, email: string) =>
    (name ?? email)?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textMain }}>Employees</h1>
          <p className="text-sm mt-1" style={{ color: textMuted }}>Manage and approve employee registrations</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setCreateModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 14,
              background: "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 6px 20px color-mix(in srgb, var(--tc-primary) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
          >
            <UserPlus size={15} /> Create Employee
          </motion.button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `color-mix(in srgb, var(--tc-primary) 13%, transparent)`, color: "var(--tc-primary)" }}>
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Create Employee Modal */}
      <CreateEmployeeModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search — debounced */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
          <input
            value={rawSearch}
            onChange={e => { setRawSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email or phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all admin-panel"
            style={{ border: `1px solid ${border}`, color: textMain, outline: "none",
              boxShadow: rawSearch ? `0 0 20px color-mix(in srgb, var(--tc-primary) 20%, transparent)` : "none" }}
          />
          {/* Live search indicator — three-dot pulse */}
          {isFetching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-[3px]">
              {[0, 0.15, 0.3].map((delay, i) => (
                <span key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "var(--tc-primary)",
                  animation: `fetchPulse 0.9s ease-in-out ${delay}s infinite`,
                  display: "inline-block",
                }} />
              ))}
            </span>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 p-1 rounded-xl admin-panel" style={{ border: `1px solid ${border}` }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => { setStatus(tab); setPage(1); }}
              className="px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: status === tab ? `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))` : "transparent",
                color: status === tab ? "#fff" : textMuted,
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Employee list */}
      <div className="rounded-2xl admin-panel" style={{ border: `1px solid ${border}`, perspective: "1000px" }}>
        {isLoading
          ? Array(5).fill(0).map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-4" style={{ borderBottom: i < 4 ? `1px solid ${border}` : "none" }}>
                <div className="w-10 h-10 rounded-full" style={{ background: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded" style={{ background: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`, animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div className="h-3 w-1/2 rounded" style={{ background: `color-mix(in srgb, var(--tc-primary) 6%, transparent)`, animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            ))
          : employees.length === 0
            ? (
              <div className="py-16 flex flex-col items-center gap-3" style={{ color: textMuted }}>
                <UserX className="w-10 h-10 opacity-30" />
                <p className="text-sm">
                  {search ? `No employees matching "${search}"` : "No employees found"}
                </p>
              </div>
            )
            : employees.map((emp, i) => {
                const sc = statusColor(emp.status);
                const displayName = emp.full_name ?? emp.email;
                return (
                  <React.Fragment key={emp.id}>
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, x: -8, zIndex: 1 }}
                    animate={{ opacity: 1, x: 0, zIndex: selectedEmpDetail === emp.id ? 10 : 1 }}
                    transition={{ delay: i * 0.03, duration: 0.22 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -5, 
                      z: 30, 
                      zIndex: 50,
                      rotateX: 4,
                      rotateY: -2,
                      background: dark ? "rgba(40, 30, 65, 0.75)" : "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(16px)",
                      border: dark ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(0,0,0,0.12)",
                      boxShadow: dark 
                        ? "inset 0 1px 2px rgba(255,255,255,0.3), 0 12px 24px rgba(0,0,0,0.8), 0 24px 48px rgba(0,0,0,0.6)" 
                        : "inset 0 1px 2px rgba(255,255,255,1), 0 12px 24px rgba(0,0,0,0.15), 0 24px 48px rgba(0,0,0,0.1)"
                    }}
                    className="px-5 py-4 flex items-center gap-4 cursor-pointer relative group"
                    onClick={() => setSelectedEmpDetail(selectedEmpDetail === emp.id ? null : emp.id)}
                    style={{ 
                      borderRadius: "16px",
                      borderBottom: i < employees.length - 1 ? `1px solid ${border}` : "1px solid transparent",
                      transformStyle: "preserve-3d",
                      willChange: "transform, background, box-shadow, z-index",
                    }}>
                    {/* Hover internal glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-var(--tc-primary)/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-accent))` }}>
                      {initials(emp.full_name, emp.email)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: textMain }}>
                        {displayName}
                      </p>
                      <p className="text-xs truncate" style={{ color: textMuted }}>
                        {emp.email}
                        {emp.city ? ` · ${emp.city}${emp.state ? `, ${emp.state}` : ""}` : ""}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0"
                      style={{ background: sc.bg, color: sc.fg }}>
                      {emp.status.replace("_", " ")}
                    </span>

                    {/* Actions for pending employees */}
                    {emp.status === "pending" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                          onClick={() => handleAction(emp.id, "approve")}
                          disabled={approving}
                          title="Approve"
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                          <CheckCircle className="w-4 h-4" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                          onClick={() => setSelectedEmp(emp.id)}
                          title="Reject"
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                          <XCircle className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </motion.div>

                  {/* ── Expanded employee detail panel ── */}
                  <AnimatePresence>
                    {selectedEmpDetail === emp.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: "hidden", borderBottom: `1px solid ${border}` }}
                      >
                        <div className="admin-panel" style={{ position: "relative", margin: "8px 16px 14px", borderRadius: 18, padding: 22 }}>
                          {/* Top row: avatar + name + status */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, var(--tc-primary), var(--tc-accent))", boxShadow: "0 6px 20px color-mix(in srgb, var(--tc-primary) 30%, transparent)", flexShrink: 0 }}>
                              {initials(emp.full_name, emp.email)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {editingId === emp.id ? (
                                <input
                                  value={editForm.fullName}
                                  onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                                  placeholder="Full Name"
                                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${border}`, color: textMain, borderRadius: 8, padding: "4px 8px", fontSize: 16, fontWeight: 800, outline: "none", width: "100%", marginBottom: 4 }}
                                />
                              ) : (
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: textMain, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.full_name ?? "No Name"}</h3>
                              )}
                              <p style={{ fontSize: 12, color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.email}</p>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 99, textTransform: "capitalize", background: sc.bg, color: sc.fg, flexShrink: 0 }}>
                              {emp.status.replace("_", " ")}
                            </span>
                          </div>

                          {/* Detail grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                            <div className="admin-panel" style={{ position: "relative", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                              <Phone size={13} style={{ color: "var(--tc-primary)" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Phone</p>
                                {editingId === emp.id ? (
                                  <input
                                    value={editForm.phone}
                                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                    placeholder="Phone"
                                    style={{ background: "transparent", border: "none", borderBottom: `1px solid ${border}`, color: textMain, fontSize: 12, fontWeight: 600, outline: "none", width: "100%" }}
                                  />
                                ) : (
                                  <p style={{ fontSize: 12, fontWeight: 600, color: textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.phone ?? "Not provided"}</p>
                                )}
                              </div>
                            </div>
                            <div className="admin-panel" style={{ position: "relative", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                              <MapPin size={13} style={{ color: "var(--tc-secondary)" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Location</p>
                                {editingId === emp.id ? (
                                  <input
                                    value={editForm.city}
                                    onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                                    placeholder="City"
                                    style={{ background: "transparent", border: "none", borderBottom: `1px solid ${border}`, color: textMain, fontSize: 12, fontWeight: 600, outline: "none", width: "100%" }}
                                  />
                                ) : (
                                  <p style={{ fontSize: 12, fontWeight: 600, color: textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {emp.city || emp.state ? `${emp.city ?? ""}${emp.city && emp.state ? ", " : ""}${emp.state ?? ""}` : "Not provided"}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="admin-panel" style={{ position: "relative", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                              <CalendarDays size={13} style={{ color: "var(--tc-accent)" }} />
                              <div>
                                <p style={{ fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Joined</p>
                                <p style={{ fontSize: 12, fontWeight: 600, color: textMain }}>{new Date(emp.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                              </div>
                            </div>
                            <div className="admin-panel" style={{ position: "relative", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                              <Shield size={13} style={{ color: emp.is_active ? "#10b981" : "#f59e0b" }} />
                              <div>
                                <p style={{ fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Account</p>
                                <p style={{ fontSize: 12, fontWeight: 600, color: emp.is_active ? "#34d399" : "#fbbf24" }}>{emp.is_active ? "Active" : "Inactive"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Rejection reason if rejected */}
                          {emp.rejection_reason && (
                            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <XCircle size={13} style={{ color: "#f87171", marginTop: 1, flexShrink: 0 }} />
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Rejection Reason</p>
                                <p style={{ fontSize: 12, color: textMuted }}>{emp.rejection_reason}</p>
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {editingId === emp.id ? (
                              <>
                                <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} className="admin-panel"
                                  onClick={() => editEmployee({ employeeId: emp.id, ...editForm })}
                                  disabled={editing}
                                  style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 12, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399", cursor: editing ? "wait" : "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.22s" }}>
                                  {editing ? "Saving..." : <><Save size={13} /> Save</>}
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} className="admin-panel"
                                  onClick={() => setEditingId(null)}
                                  style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 12, background: "color-mix(in srgb, var(--tc-primary) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)", color: "var(--tc-primary)", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.22s" }}>
                                  <XCircle size={13} /> Cancel
                                </motion.button>
                              </>
                            ) : (
                              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} className="admin-panel"
                                onClick={() => {
                                  setEditingId(emp.id);
                                  setEditForm({ fullName: emp.full_name ?? "", phone: emp.phone ?? "", city: emp.city ?? "" });
                                }}
                                style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 12, background: "color-mix(in srgb, var(--tc-primary) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)", color: "var(--tc-primary)", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.22s" }}>
                                <Edit3 size={13} /> Modify
                              </motion.button>
                            )}

                            <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} className="admin-panel"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to completely remove this employee?")) {
                                  deleteEmployee(emp.id);
                                }
                              }}
                              disabled={deleting}
                              style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 12, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)", color: "#f87171", cursor: deleting ? "wait" : "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.22s" }}>
                              {deleting ? "Removing..." : <><Trash2 size={13} /> Remove</>}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </React.Fragment>
                );
              })}
        {/* Pagination */}
        {pagination && pagination.total > pagination.limit && (
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${border}` }}>
            <span className="text-xs" style={{ color: textMuted }}>
              {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ background: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`, color: "var(--tc-primary)" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={!pagination.totalPages || page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ background: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`, color: "var(--tc-primary)" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
            onClick={e => e.target === e.currentTarget && setSelectedEmp(null)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: dark ? "rgba(12,10,28,0.98)" : "#fff", border: `1px solid ${border}`, boxShadow: `0 24px 60px rgba(0,0,0,0.5)` }}>
              <h3 className="font-bold text-base mb-1" style={{ color: textMain }}>Reject Employee</h3>
              <p className="text-xs mb-4" style={{ color: textMuted }}>Provide a reason (min 10 characters)</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Incomplete documentation…"
                className="w-full p-3 rounded-xl text-sm resize-none"
                style={{ background: `color-mix(in srgb, var(--tc-primary) 3%, transparent)`, border: `1px solid ${border}`, color: textMain, outline: "none",
                  transition: "border-color 0.2s", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = ""; e.target.style.boxShadow = `0 0 0 2px color-mix(in srgb, var(--tc-primary) 13%, transparent)`; }}
                onBlur={e => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; }}
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setSelectedEmp(null); setRejectReason(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${border}`, color: textMuted, background: "transparent" }}>
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedEmp, "reject")}
                  disabled={approving || rejectReason.trim().length < 10}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: "rgba(239,68,68,0.85)", cursor: rejectReason.trim().length < 10 ? "not-allowed" : "pointer" }}>
                  {approving ? "Rejecting…" : "Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
