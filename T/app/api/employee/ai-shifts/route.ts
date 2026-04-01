import { NextRequest, NextResponse } from "next/server";
import { suggestShiftsForEmployee, type EmployeeProfile, type AvailableShift } from "@/lib/ai/shiftSuggestions";

export async function POST(req: NextRequest) {
  try {
    const body: { employee: EmployeeProfile; shifts: AvailableShift[] } = await req.json();
    const suggestions = await suggestShiftsForEmployee(body.employee, body.shifts);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[AI Shifts] Error:", err);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
