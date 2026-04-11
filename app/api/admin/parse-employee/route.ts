/**
 * /api/admin/parse-employee
 * POST — AI agent: parse structured text message into employee form data
 * Uses Google Gemini Flash to extract fields from freeform text.
 */
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/utils/api";
import { generateJSON } from "@/lib/ai/gemini";

interface ParsedEmployee {
  fullName?: string;
  email?: string;
  phone?: string;
  state?: string;
  city?: string;
  idProofType?: string;
  altPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankName?: string;
  notes?: string;
}

const SYSTEM_PROMPT = `You are an AI assistant that extracts employee details from unstructured text messages. 
Parse the input and return ONLY a JSON object with the fields that are clearly mentioned. Do NOT invent or assume values.

Key mapping rules:
- "Name" / "Full Name" → "fullName"
- "Phone" / "Mobile" / "Contact" → "phone" (extract just 10 digits, remove +91 or 0 prefix)
- "Email" / "Mail" / "E-mail" → "email"
- "State" → "state" (use full Indian state name, e.g., "Karnataka" not "KA")
- "City" / "Place" / "Location" → "city"
- "Aadhaar" / "Aadhar" → "idProofType": "aadhaar"
- "PAN" → "idProofType": "pan"
- "Voter ID" / "Voter" → "idProofType": "voter_id"
- "Passport" → "idProofType": "passport"
- "Alt Phone" / "Alternate" → "altPhone"
- "Address" / "Addr" → "addressLine1"
- "Pincode" / "PIN" / "Zip" → "pincode"
- "Bank Account" / "Account No" → "bankAccount"
- "IFSC" → "bankIfsc" (always uppercase)
- "Bank" / "Bank Name" → "bankName"
- Anything else relevant → "notes"

Return a JSON object with ONLY the fields you can confidently extract. Omit any field that is not mentioned.`;

export const POST = withAdmin(async (request) => {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { status: "error", message: "Please provide a valid text message with employee details." },
        { status: 400 }
      );
    }

    const parsed = await generateJSON<ParsedEmployee>(
      `${SYSTEM_PROMPT}\n\nInput text:\n${message}`
    );

    // Clean up phone number — remove +91, spaces, dashes
    if (parsed?.phone) {
      let ph = String(parsed.phone).replace(/[\s\-+]/g, "");
      if (ph.startsWith("91") && ph.length === 12) ph = ph.slice(2);
      if (ph.startsWith("0") && ph.length === 11) ph = ph.slice(1);
      parsed.phone = ph;
    }

    // Uppercase IFSC
    if (parsed?.bankIfsc) {
      parsed.bankIfsc = String(parsed.bankIfsc).toUpperCase();
    }

    return NextResponse.json({ status: "ok", data: parsed });
  } catch (err: any) {
    console.error("[ParseEmployee] AI error:", err);
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
