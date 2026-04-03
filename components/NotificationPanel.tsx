"use client";
/**
 * NotificationPanel.tsx
 * Bell button + slide-down notification panel.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Clock, CalendarDays, IndianRupee, UserCheck, X, Check, ChevronRight } from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";
import { useRouter } from "next/navigation";

interface NotifItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
  accent: string;
}

interface Props {
  role: "admin" | "employee";
  userId: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatActivityTitle(action: string): string {
  const map: Record<string, string> = {
    "employee.create": "Employee Added",
    "shift.create":    "Shift Created",
    "shift.publish":   "Shift Published",
    "shift.confirm":   "Shift Confirmed",
    "payment.clear":   "Payment Cleared",
    "profile.approve": "Profile Approved",
    "profile.reject":  "Profile Rejected",
  };
  return map[action] ?? action.replace(".", " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function NotificationPanel({ role, userId }: Props) {
  const { dark } = useTheme();
  const router = useRouter();
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);

  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.45)" : "rgba(30,20,80,0.4)";
  const panelBg   = dark ? "rgba(12,9,28,0.48)" : "rgba(255,255,255,0.35)";
  const border    = `color-mix(in srgb, var(--tc-primary) ${dark ? 16 : 13}%, transparent)`;
  const rowHover  = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";

  const unread = items.filter(n => !n.read).length;

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      if (role === "admin") {
        const [profilesRes, shiftsRes, activityRes] = await Promise.all([
          fetch("/api/admin/employees?status=pending&limit=5"),
          fetch("/api/admin/shifts?status=published&limit=5"),
          fetch("/api/admin/activity"),
        ]);

        const profiles = profilesRes.ok  ? await profilesRes.json()  : null;
        const shifts   = shiftsRes.ok    ? await shiftsRes.json()    : null;
        const activity = activityRes.ok  ? await activityRes.json()  : null;

        const notifs: NotifItem[] = [];

        (profiles?.data?.employees ?? []).slice(0, 3).forEach((e: Record<string, string>) => {
          notifs.push({
            id: `approval-${e.id}`,
            icon: <UserCheck size={14} />,
            title: "Pending Approval",
            message: `${e.full_name ?? e.email} is awaiting profile review`,
            time: timeAgo(e.joined_at ?? new Date().toISOString()),
            read: false,
            href: "/admin/employees",
            accent: "#f59e0b",
          });
        });

        (shifts?.data?.shifts ?? []).slice(0, 3).forEach((s: Record<string, unknown>) => {
          notifs.push({
            id: `shift-${s.id}`,
            icon: <CalendarDays size={14} />,
            title: "Upcoming Shift",
            message: `${s.title} · ${s.venue} · ${s.confirmed_count}/${s.maxEmployees} confirmed`,
            time: timeAgo((s.examDate as string) ?? new Date().toISOString()),
            read: true,
            href: "/admin/shifts",
            accent: "var(--tc-primary)",
          });
        });

        (activity?.data?.activity ?? []).slice(0, 3).forEach((a: Record<string, string>) => {
          notifs.push({
            id: `activity-${a.id}`,
            icon: <CheckCircle2 size={14} />,
            title: formatActivityTitle(a.action ?? ""),
            message: a.details ?? "",
            time: timeAgo(a.created_at ?? new Date().toISOString()),
            read: true,
            accent: "var(--tc-secondary)",
          });
        });

        setItems(notifs);

      } else {
        const [shiftsRes, paymentsRes, notifsRes, profileRes] = await Promise.all([
          fetch("/api/employee/shifts"),
          fetch("/api/employee/payments"),
          fetch("/api/employee/notifications"),
          fetch("/api/employee/profile"),
        ]);

        const shifts   = shiftsRes.ok   ? await shiftsRes.json()   : null;
        const payments = paymentsRes.ok ? await paymentsRes.json() : null;
        const notifs   = notifsRes.ok   ? await notifsRes.json()   : null;
        const profileData = profileRes.ok ? await profileRes.json() : null;

        const empItems: NotifItem[] = [];

        // Profile completion notification for new employees
        const profile = profileData?.data?.profile;
        if (!profile || profile.status !== "approved") {
          empItems.push({
            id: "profile-complete",
            icon: <UserCheck size={14} />,
            title: !profile ? "Complete Your Profile" : profile.status === "pending" ? "Profile Under Review" : "Profile Update Needed",
            message: !profile
              ? "Please complete your KYC profile to start taking shifts"
              : profile.status === "pending"
              ? "Your profile is awaiting admin approval"
              : "Please update your profile and resubmit",
            time: "now",
            read: false,
            href: "/employee/profile",
            accent: !profile ? "var(--tc-primary)" : profile.status === "pending" ? "#f59e0b" : "#ef4444",
          });
        }

        (notifs?.data?.notifications ?? []).slice(0, 4).forEach((n: Record<string, unknown>) => {
          empItems.push({
            id: `notif-${n.id}`,
            icon: <Bell size={14} />,
            title: (n.title as string) ?? "Notification",
            message: (n.message as string) ?? "",
            time: timeAgo((n.created_at as string) ?? new Date().toISOString()),
            read: n.is_read === true || n.is_read === "true",
            href: "/employee/dashboard",
            accent: "var(--tc-primary)",
          });
        });

        (shifts?.data?.shifts ?? [])
          .filter((s: Record<string, unknown>) => s.myStatus === "confirmed" || s.myStatus === "pending")
          .slice(0, 3)
          .forEach((s: Record<string, unknown>) => {
            empItems.push({
              id: `shift-${s.id}`,
              icon: <CalendarDays size={14} />,
              title: `Shift ${s.myStatus === "confirmed" ? "Confirmed" : "Pending"}`,
              message: `${s.title} · ${s.venue} · ${s.examDate}`,
              time: timeAgo((s.examDate as string) ?? new Date().toISOString()),
              read: true,
              href: "/employee/shifts",
              accent: s.myStatus === "confirmed" ? "#10b981" : "#f59e0b",
            });
          });

        (payments?.data?.payments ?? [])
          .filter((p: Record<string, unknown>) => p.status === "pending")
          .slice(0, 2)
          .forEach((p: Record<string, unknown>) => {
            empItems.push({
              id: `payment-${p.id}`,
              icon: <IndianRupee size={14} />,
              title: "Payment Pending",
              message: `₹${p.amountRupees} for ${p.venue} on ${p.shiftDate}`,
              time: timeAgo((p.shiftDate as string) ?? new Date().toISOString()),
              read: true,
              href: "/employee/payments",
              accent: "#f59e0b",
            });
          });

        const cleared = (payments?.data?.payments ?? []).filter((p: Record<string, unknown>) => p.status === "cleared");
        if (cleared.length > 0) {
          const latest = cleared[0] as Record<string, unknown>;
          empItems.push({
            id: `paid-${latest.id}`,
            icon: <IndianRupee size={14} />,
            title: "Salary Credited!",
            message: `₹${latest.amountRupees} credited · Ref: ${latest.referenceNumber ?? "N/A"}`,
            time: timeAgo((latest.clearedAt as string) ?? new Date().toISOString()),
            read: true,
            href: "/employee/payments",
            accent: "#10b981",
          });
        }

        setItems(empItems);
      }
    } catch (e) {
      console.error("[NotificationPanel]", e);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  const markAllRead  = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const handleClick  = (item: NotifItem) => {
    setItems(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    if (item.href) { setOpen(false); router.push(item.href); }
  };

  // Glass frost bell button styles — matching ThemePanel icons
  const bellBg = open
    ? (dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.45)")
    : (dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.30)");
  const bellBorder = dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.65)";
  const bellShadow = open
    ? (dark
      ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.30), 0 0 0 2px color-mix(in srgb, var(--tc-primary) 30%, transparent)"
      : "inset 0 1px 0 rgba(255,255,255,0.90), 0 4px 12px rgba(0,0,0,0.08), 0 0 0 2px color-mix(in srgb, var(--tc-primary) 20%, transparent)")
    : (dark
      ? "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -0.5px 0 rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.25)"
      : "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -0.5px 0 rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.06)");

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button — Glass Frost */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(o => !o)}
        style={{
          width: 32, height: 32, borderRadius: 10,
          background: bellBg,
          border: `1px solid ${bellBorder}`,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: bellShadow,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", color: "var(--tc-primary)",
          transition: "background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          position: "relative",
        }}>
        <motion.div
          animate={unread > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}>
          <Bell size={14} />
        </motion.div>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: "absolute", top: -3, right: -3,
              width: 16, height: 16, borderRadius: "50%",
              background: "var(--tc-secondary)", color: "#fff",
              fontSize: 9, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${dark ? "#08071a" : "#fff"}`,
            }}>
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </motion.button>

      {/* Backdrop */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9990 }} onClick={() => setOpen(false)} />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, y: -12, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.75 }}
            style={{
              position: "fixed",
              top: 58, right: 52,
              zIndex: 9999,
              width: 340,
              maxHeight: 480,
              background: "var(--spatial-glass-bg)",
              border: "var(--spatial-glass-border)",
              borderRadius: 20,
              backdropFilter: "var(--spatial-glass-blur)",
              WebkitBackdropFilter: "var(--spatial-glass-blur)",
              boxShadow: "var(--spatial-glass-shadow)",
              overflow: "hidden",
              display: "flex", flexDirection: "column",
              willChange: "transform, opacity",
              transform: "translateZ(0)",
            }}>

            {/* Header */}
            <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={14} style={{ color: "var(--tc-primary)" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: textMain }}>Notifications</span>
                {unread > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 99, background: "var(--tc-secondary)", color: "#fff" }}>
                    {unread} new
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 7, background: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`, color: "var(--tc-primary)", border: "none", cursor: "pointer", fontWeight: 600, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 3 }}>
                    <Check size={9} /> All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ width: 22, height: 22, borderRadius: 6, background: `color-mix(in srgb, var(--tc-primary) 7%, transparent)`, border: "none", cursor: "pointer", color: textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 18px", alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `color-mix(in srgb, var(--tc-primary) 7%, transparent)`, flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ height: 11, width: "55%", borderRadius: 6, background: `color-mix(in srgb, var(--tc-primary) 6%, transparent)`, animation: "pulse 1.5s ease-in-out infinite" }} />
                      <div style={{ height: 9, width: "80%", borderRadius: 6, background: `color-mix(in srgb, var(--tc-primary) 3%, transparent)`, animation: "pulse 1.5s ease-in-out infinite" }} />
                    </div>
                  </div>
                ))
              ) : items.length === 0 ? (
                <div style={{ padding: "40px 18px", textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: `color-mix(in srgb, var(--tc-primary) 7%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--tc-primary)" }}>
                    <Bell size={20} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: textMain, marginBottom: 4 }}>All caught up!</p>
                  <p style={{ fontSize: 11, color: textMuted }}>No new notifications right now</p>
                </div>
              ) : (
                items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onClick={() => handleClick(item)}
                    style={{
                      display: "flex", gap: 12, padding: "11px 18px",
                      cursor: item.href ? "pointer" : "default",
                      background: item.read ? "transparent" : `color-mix(in srgb, var(--tc-primary) 6%, transparent)`,
                      borderLeft: item.read ? "3px solid transparent" : `3px solid ${item.accent}`,
                      transition: "background 0.15s ease",
                      alignItems: "flex-start",
                    }}
                    onMouseEnter={e => { if (item.href) (e.currentTarget as HTMLDivElement).style.background = rowHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = item.read ? "transparent" : `color-mix(in srgb, var(--tc-primary) 6%, transparent)`; }}>

                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: `${item.accent}18`, color: item.accent,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {item.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                        <p style={{ fontSize: 12, fontWeight: item.read ? 500 : 700, color: textMain, lineHeight: 1.3 }}>{item.title}</p>
                        <span style={{ fontSize: 10, color: textMuted, flexShrink: 0, marginTop: 1 }}>{item.time}</span>
                      </div>
                      {item.message && (
                        <p style={{ fontSize: 11, color: textMuted, marginTop: 2, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.message}
                        </p>
                      )}
                    </div>

                    {item.href && <ChevronRight size={12} style={{ color: textMuted, flexShrink: 0, marginTop: 4 }} />}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {role === "admin" && (
              <div style={{ padding: "10px 18px", borderTop: `1px solid ${border}`, flexShrink: 0 }}>
                <button
                  onClick={() => { setOpen(false); router.push("/admin/employees"); }}
                  style={{ width: "100%", padding: "8px 0", borderRadius: 10, background: `color-mix(in srgb, var(--tc-primary) 7%, transparent)`, border: `1px solid var(--tc-primary)`, color: "var(--tc-primary)", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
                  View all employees →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
