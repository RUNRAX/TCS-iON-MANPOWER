/**
 * POST /api/admin/ai-summary
 * Generates AI analytics summary from dashboard metrics.
 * Protected: admin-only, Zod-validated input.
 */
import { NextRequest } from "next/server";
import { withAdmin, ok, serverError } from "@/lib/utils/api";
import { generateAnalyticsSummary, type DashboardMetrics } from "@/lib/ai/analyticsSummary";
import { z } from "zod";

const MetricsSchema = z.object({
  totalEmployees: z.number().min(0),
  activeShifts: z.number().min(0),
  confirmedShifts: z.number().min(0),
  pendingShifts: z.number().min(0),
  totalPaymentsThisMonth: z.number().min(0),
  pendingPayments: z.number().min(0),
  newRegistrationsThisWeek: z.number().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = MetricsSchema.safeParse(body);
    if (!parsed.success) {
      return ok({ summary: "Unable to generate summary — invalid metrics data provided." });
    }
    const summary = await generateAnalyticsSummary(parsed.data as DashboardMetrics);
    return ok({ summary });
  } catch (err) {
    console.error("[AI Analytics] Error:", err);
    return serverError("AI summary generation failed");
  }
});
