/**
 * POST /api/employee/ai-shifts
 * AI-powered shift suggestions for employees.
 * Protected: employee-only, Zod-validated input.
 */
import { NextRequest } from "next/server";
import { withEmployee, ok, serverError } from "@/lib/utils/api";
import { suggestShiftsForEmployee } from "@/lib/ai/shiftSuggestions";
import { z } from "zod";

const ShiftsRequestSchema = z.object({
  employee: z.object({
    name: z.string().max(100),
    completedShifts: z.number().min(0),
    preferredShiftTime: z.string().optional(),
    avgRating: z.number().min(0).max(5).optional(),
    recentCentres: z.array(z.string()).max(10).optional(),
  }),
  shifts: z.array(z.object({
    id: z.string(),
    centre: z.string().max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().max(50),
    slots: z.number().min(0),
    payRate: z.number().min(0),
  })).max(50),
});

export const POST = withEmployee(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = ShiftsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return ok({ suggestions: [] });
    }
    const suggestions = await suggestShiftsForEmployee(parsed.data.employee, parsed.data.shifts);
    return ok({ suggestions });
  } catch (err) {
    console.error("[AI Shifts] Error:", err);
    return serverError("AI shift suggestion failed");
  }
});
