import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/utils/api";
import { generateJSON } from "@/lib/ai/gemini";

interface ParsedShift {
  title?: string;
  venue?: string;
  examDate?: string;
  shifts?: Array<{
    shiftNumber: number;
    startTime: string;
    endTime: string;
    maxEmployees: number;
    payAmount: number;
    notes?: string;
  }>;
}

const SYSTEM_PROMPT = `You are an AI assistant that extracts exam shift details from unstructured text messages.
Parse the input and return ONLY a JSON object with the fields that are clearly mentioned. Do NOT invent or assume values.

Key mapping rules:
- "Venue" / "Center" / "Location" → "venue"
- "Title" / "Exam" → "title"
- "Date" → "examDate" (convert to YYYY-MM-DD if possible)
- Shifts is an array. Instructed to assume exactly one shift if the text implies one, or extract multiple if mentioned. Inside each shift:
  - "Start" / "Start time" / "Start AM/PM" → "startTime" (convert to HH:mm 24-hr format, e.g., "09:00", "13:00")
  - "End" / "End time" / "End AM/PM" → "endTime" (convert to HH:mm 24-hr format)
  - "Pay" / "Payment" → "payAmount" (number)
  - "Staff" / "Invigilators" / "People" → "maxEmployees" (number)
  - "Shift Number" → "shiftNumber" (integer, default to 1 if not specified but implies a shift)
  - Anything else relevant to the shift → "notes"

Return a JSON object with ONLY the fields you can confidently extract. Omit any field that is not mentioned.`;

export const POST = withAdmin(async (request) => {
  try {
    const { message, date } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { status: "error", message: "Please provide a valid text message with shift details." },
        { status: 400 }
      );
    }

    const parsed = await generateJSON<ParsedShift>(
      `${SYSTEM_PROMPT}\n\nContext Date: ${date}\n\nInput text:\n${message}`
    );

    return NextResponse.json({ status: "ok", data: parsed });
  } catch (err: any) {
    console.error("[ParseShift] AI error:", err);
    if (err?.status === 429 || String(err).includes("429") || String(err).includes("quota") || String(err).includes("Quota") || String(err).includes("exceeded")) {
      return NextResponse.json(
        { status: "error", message: "AI service is busy (Quota Exceeded). Please try manual fill." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { status: "error", message: `AI Error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
});
