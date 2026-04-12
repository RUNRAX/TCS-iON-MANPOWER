/**
 * lib/ai/shiftSuggestions.ts
 * Generates personalized shift recommendations for an employee via Groq Llama.
 */

import { generateJSON } from "./groq";

export interface EmployeeProfile {
  name: string;
  completedShifts: number;
  preferredShiftTime?: string; // "morning" | "afternoon" | "evening"
  avgRating?: number;
  recentCentres?: string[];
}

export interface AvailableShift {
  id: string;
  centre: string;
  date: string;
  time: string;
  slots: number;
  payRate: number;
}

export interface ShiftSuggestion {
  shiftId: string;
  reason: string;
  score: number; // 1–10 relevance
}

export async function suggestShiftsForEmployee(
  employee: EmployeeProfile,
  availableShifts: AvailableShift[]
): Promise<ShiftSuggestion[]> {
  if (availableShifts.length === 0) return [];

  const prompt = `
You are an intelligent shift scheduling assistant for TCS iON exam management.

Employee profile:
- Name: ${employee.name}
- Completed shifts: ${employee.completedShifts}
- Preferred shift time: ${employee.preferredShiftTime ?? "any"}
- Average rating: ${employee.avgRating ?? "N/A"}/5
- Recently worked at: ${employee.recentCentres?.join(", ") ?? "none"}

Available shifts:
${availableShifts.map(s => `- ID: ${s.id} | Centre: ${s.centre} | Date: ${s.date} | Time: ${s.time} | Open slots: ${s.slots} | Pay: ₹${s.payRate}`).join("\n")}

Return up to 3 best-matched shifts as a JSON array. Each element must have:
- shiftId (string, exactly as given)
- reason (string, 1 short sentence explaining why it suits this employee)
- score (number 1–10, how well it matches their profile)

Sort by score descending.
`;

  try {
    return await generateJSON<ShiftSuggestion[]>(prompt);
  } catch {
    return [];
  }
}
