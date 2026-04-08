"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/context/ThemeContext";
import { useEmployeeShifts, useConfirmShift, useCancelShift } from "@/hooks/use-api";
import { CalendarDays, Clock, MapPin, Users, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ShiftWithAssignment } from "@/types/database";

export default function EmployeeShifts() {
  const { theme: t, dark } = useTheme();
  const textMain  = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.5)" : "rgba(30,20,80,0.45)";
  const cardBg    = dark ? "rgba(12,10,28,0.82)" : "rgba(255,255,255,0.35)";
  const borderCol = dark ? `color-mix(in srgb, var(--tc-primary) 15%, transparent)` : `color-mix(in srgb, var(--tc-primary) 16%, transparent)`;

  const { data, isLoading } = useEmployeeShifts();
  const { mutate: confirm, isPending: confirming, variables: confirmingId } = useConfirmShift();
  const { mutate: cancel } = useCancelShift();

  const shifts = useMemo(() => data?.shifts ?? [], [data]);
  const available = shifts.filter(s => s.status === "published" && !s.myStatus);
  const booked    = shifts.filter(s => s.myStatus);
  const upcomingBooked = booked.filter(s => s.myStatus !== "completed");
  const completedBooked = booked.filter(s => s.myStatus === "completed");

  const handleBook = (shiftId: string) => {
    confirm(shiftId, {
      onSuccess: () => toast.success("Shift booked successfully ✓"),
      onError: (e) => toast.error(e.message),
    });
  };

  const ShiftCard = ({ s, showAction }: { s: ShiftWithAssignment; showAction: boolean }) => {
    const isBusy = confirming && confirmingId === s.id;
    const statusColor = {
      pending:   { bg: "rgba(245,158,11,0.15)", fg: "#fbbf24" },
      confirmed: { bg: "rgba(16,185,129,0.15)", fg: "#34d399" },
      completed: { bg: `color-mix(in srgb, var(--tc-primary) 9%, transparent)`,         fg: "var(--tc-primary)" },
      absent:    { bg: "rgba(239,68,68,0.15)",   fg: "#f87171" },
    }[s.myStatus as "pending" | "confirmed" | "completed" | "absent"] ?? null;

    const isCompleted = s.myStatus === "completed";

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="admin-panel rounded-2xl p-5" 
        style={{ 
          position: "relative",
          ...(isCompleted ? {
            background: dark ? "rgba(20,18,40,0.4)" : "rgba(255,255,255,0.4)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}`,
            boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.2)" : "0 8px 32px rgba(31,38,135,0.07)"
          } : {})
        }}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `color-mix(in srgb, var(--tc-primary) 13%, transparent)`, color: "var(--tc-primary)" }}>
            <CalendarDays className="w-4 h-4" />
          </div>
          {statusColor && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
              style={{ background: statusColor.bg, color: statusColor.fg }}>{s.myStatus}</span>
          )}
        </div>
        <h3 className="font-bold text-sm mb-1 truncate" style={{ color: textMain }}>{s.title}</h3>
        <p className="text-xs mb-3" style={{ color: textMuted }}>{s.examDate} · Shift {s.shiftNumber}</p>
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: textMuted }}>
            <Clock className="w-3 h-3" />{s.startTime} – {s.endTime}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: textMuted }}>
            <MapPin className="w-3 h-3" />{s.venue}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: textMuted }}>
            <Users className="w-3 h-3" />{s.confirmedCount}/{s.maxEmployees} confirmed
          </div>
        </div>
        {showAction && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => handleBook(s.id)} disabled={isBusy}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))` }}>
            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {isBusy ? "Booking…" : "Book This Shift"}
          </motion.button>
        )}
      </motion.div>
    );
  };

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array(6).fill(0).map((_, i) => <div key={i} className="h-52 rounded-2xl skeleton" style={{ background: cardBg }} />)}
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {upcomingBooked.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold" style={{ color: textMain }}>Upcoming Shifts</h2>
            <p className="text-sm mt-1" style={{ color: textMuted }}>Details of your booked shifts</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcomingBooked.map(s => <ShiftCard key={s.id} s={s} showAction={false} />)}
          </div>
        </section>
      )}

      {completedBooked.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: textMain }}>Completed Shifts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completedBooked.map(s => <ShiftCard key={s.id} s={s} showAction={false} />)}
          </div>
        </section>
      )}

      <section>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textMain }}>Available Shifts</h1>
          <p className="text-sm mt-1" style={{ color: textMuted }}>Book your preferred exam centre shifts</p>
        </div>
        {available.length === 0
          ? <div className="mt-8 text-center py-16 text-sm" style={{ color: textMuted }}>No shifts available right now. Check back soon.</div>
          : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {available.map(s => <ShiftCard key={s.id} s={s} showAction={true} />)}
            </div>
        }
      </section>
    </div>
  );
}
