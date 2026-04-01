import { NextRequest, NextResponse } from "next/server";
import { generateAnalyticsSummary, type DashboardMetrics } from "@/lib/ai/analyticsSummary";

export async function POST(req: NextRequest) {
  try {
    const metrics: DashboardMetrics = await req.json();
    const summary = await generateAnalyticsSummary(metrics);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[AI Analytics] Error:", err);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
