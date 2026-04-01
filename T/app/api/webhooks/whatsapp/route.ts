/**
 * POST /api/webhooks/whatsapp
 * Receives WhatsApp delivery status updates from Twilio
 * Verifies HMAC signature before processing
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;

// ── Verify Twilio webhook signature
async function verifyTwilioSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const twilioSignature = request.headers.get("x-twilio-signature");
  if (!twilioSignature) return false;

  const url = request.url;

  // Parse form body into sorted key=value pairs
  const params = new URLSearchParams(body);
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${value}`)
    .join("");

  const dataToSign = url + sortedParams;

  // HMAC-SHA1
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TWILIO_AUTH_TOKEN),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(dataToSign)
  );

  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));

  // Constant-time comparison
  return timingSafeEqual(computed, twilioSignature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  // ── Verify Twilio signature (security critical)
  const isValid = await verifyTwilioSignature(request, body);
  if (!isValid) {
    console.error("[WhatsApp Webhook] Invalid Twilio signature — rejected");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const params = new URLSearchParams(body);
  const messageId = params.get("MessageSid");
  const status    = params.get("MessageStatus");

  if (!messageId || !status) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  // Map Twilio status to our internal status
  const statusMap: Record<string, string> = {
    queued: "queued",
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
    undelivered: "failed",
  };

  const mappedStatus = statusMap[status] ?? "sent";

  // ── Update notification record
  const supabase = createAdminClient();
  await supabase
    .from("notifications")
    .update({ whatsapp_status: mappedStatus })
    .eq("whatsapp_message_id", messageId);

  return new NextResponse("OK", { status: 200 });
}
