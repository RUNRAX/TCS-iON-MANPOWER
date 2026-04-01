/**
 * lib/ai/analyticsSummary.ts
 * Generates a natural-language summary of admin dashboard metrics via Gemini.
 */

import { generateText } from "./gemini";

export interface DashboardMetrics {
  totalEmployees: number;
  activeShifts: number;
  confirmedShifts: number;
  pendingShifts: number;
  totalPaymentsThisMonth: number;
  pendingPayments: number;
  newRegistrationsThisWeek: number;
  date: string;
}

export async function generateAnalyticsSummary(metrics: DashboardMetrics): Promise<string> {
  const prompt = `
You are an operations analytics assistant for TCS iON, a professional exam management platform in India.

Today is ${metrics.date}.

Here are the current dashboard metrics:
- Total registered employees: ${metrics.totalEmployees}
- New registrations this week: ${metrics.newRegistrationsThisWeek}
- Active exam shifts: ${metrics.activeShifts}
- Confirmed shift slots: ${metrics.confirmedShifts}
- Pending confirmations: ${metrics.pendingShifts}
- Total payments this month: ₹${metrics.totalPaymentsThisMonth.toLocaleString("en-IN")}
- Pending payment disbursals: ${metrics.pendingPayments}

Write a concise 2–3 sentence executive summary of these metrics. 
Highlight any concerns (high pending counts, low confirmations) or positive trends.
Use a professional but clear tone. Do NOT use bullet points or headings.
`;

  return generateText(prompt);
}
