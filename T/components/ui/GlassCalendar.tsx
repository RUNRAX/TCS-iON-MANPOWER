"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";

interface GlassCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
  minDate?: string;
}

export default function GlassCalendar({ selectedDate, onSelect, onClose, minDate }: GlassCalendarProps) {
  const { dark } = useTheme();
  
  // Parse initial view from selectedDate
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = useMemo(() => {
    const arr = [];
    // Padding for previous month days
    for (let i = 0; i < firstDayOfMonth; i++) arr.push(null);
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [currentYear, currentMonth, firstDayOfMonth, daysInMonth]);

  const monthName = viewDate.toLocaleString("default", { month: "long" });

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  };

  const isSelected = (day: number) => {
    const d = new Date(selectedDate);
    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const isDisabled = (day: number) => {
    if (!minDate) return false;
    const d = new Date(currentYear, currentMonth, day);
    const min = new Date(minDate);
    return d < min;
  };

  const onDateClick = (day: number) => {
    if (isDisabled(day)) return;
    const d = new Date(currentYear, currentMonth, day);
    // Format as YYYY-MM-DD manually to avoid timezone shift
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    onSelect(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  // Glass tokens
  const glassBg = dark ? "rgba(12, 10, 32, 0.88)" : "rgba(255, 255, 255, 0.94)";
  const glassBorder = dark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
  const textMain = dark ? "#fff" : "#000";
  const textMuted = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute z-[100] mt-2 rounded-2xl overflow-hidden p-4"
      style={{
        width: 300,
        background: glassBg,
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        border: `1px solid ${glassBorder}`,
        boxShadow: dark 
          ? "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)" 
          : "0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span style={{ fontSize: 13, color: textMuted, fontWeight: 600 }}>{currentYear}</span>
          <span style={{ fontSize: 17, color: textMain, fontWeight: 700 }}>{monthName}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={handlePrevMonth} className="p-2 rounded-lg transition-colors hover:bg-white/5">
            <ChevronLeft size={16} style={{ color: textMain }} />
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-lg transition-colors hover:bg-white/5">
            <ChevronRight size={16} style={{ color: textMain }} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} className="text-center" style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {day && (
              <motion.button
                whileHover={!isDisabled(day) ? { scale: 1.15, z: 10 } : {}}
                whileTap={!isDisabled(day) ? { scale: 0.9 } : {}}
                onClick={() => onDateClick(day)}
                disabled={isDisabled(day)}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: isSelected(day) ? 700 : 500,
                  background: isSelected(day) 
                    ? "linear-gradient(135deg, var(--tc-primary), var(--tc-secondary))" 
                    : isToday(day)
                    ? "color-mix(in srgb, var(--tc-primary) 12%, transparent)"
                    : "transparent",
                  color: isSelected(day) ? "#fff" : isDisabled(day) ? "rgba(255,255,255,0.15)" : textMain,
                  border: isToday(day) && !isSelected(day) ? "1px solid var(--tc-primary)" : "none",
                  cursor: isDisabled(day) ? "not-allowed" : "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {day}
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 flex justify-between items-center border-t border-white/5">
        <button 
          onClick={() => {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            onSelect(`${yyyy}-${mm}-${dd}`);
            onClose();
          }}
          className="text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-white"
          style={{ color: "var(--tc-primary)" }}
        >
          Today
        </button>
        <button 
          onClick={onClose}
          className="text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-white"
          style={{ color: textMuted }}
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
