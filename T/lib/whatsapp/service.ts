/**
 * lib/whatsapp/service.ts
 * WhatsApp Cloud API via Meta.
 * In dev (no META_WHATSAPP_TOKEN set), messages are logged to console only.
 */
import { createAdminClient } from "@/lib/supabase/server";

export const MESSAGE_TEMPLATES = {
  newShift: (d: { employeeName:string; examDate:string; shiftNumber:number; startTime:string; endTime:string; venue:string; loginUrl:string; deadline:string }) =>
    `*TCS ION MANPOWER*\n\nHello ${d.employeeName},\n\nA new exam shift is available for you.\n\nDATE: ${d.examDate}\nSHIFT: ${d.shiftNumber}\nTIME: ${d.startTime} to ${d.endTime}\nVENUE: ${d.venue}\n\nPlease log in and confirm your slot:\n${d.loginUrl}\n\nRespond by: ${d.deadline}\n\n- TCS ION Admin`,

  shiftConfirmed: (d: { employeeName:string; examDate:string; shiftNumber:number; startTime:string; endTime:string; venue:string }) =>
    `*SHIFT CONFIRMED*\n\nHi ${d.employeeName},\n\nYour shift has been confirmed.\n\nDATE: ${d.examDate}\nSHIFT: ${d.shiftNumber}\nTIME: ${d.startTime} to ${d.endTime}\nVENUE: ${d.venue}\n\nPlease arrive 15 minutes early and carry your photo ID.\n\n- TCS ION Admin`,

  paymentCleared: (d: { employeeName:string; examDate:string; shiftNumber:number; amountRupees:number; referenceNumber?:string; loginUrl:string }) =>
    `*PAYMENT RELEASED*\n\nHi ${d.employeeName},\n\nYour payment has been processed.\n\nSHIFT DATE: ${d.examDate} (Shift ${d.shiftNumber})\nAMOUNT: Rs. ${d.amountRupees.toLocaleString("en-IN")}${d.referenceNumber ? `\nREF: ${d.referenceNumber}` : ""}\n\n- TCS ION Admin`,

  profileApproved: (d: { employeeName:string; loginUrl:string }) =>
    `*PROFILE APPROVED*\n\nHi ${d.employeeName},\n\nYour profile has been approved. You can now view and confirm exam shifts.\n\nLogin here:\n${d.loginUrl}\n\n- TCS ION Admin`,

  profileRejected: (d: { employeeName:string; reason:string; loginUrl:string }) =>
    `*PROFILE UPDATE REQUIRED*\n\nHi ${d.employeeName},\n\nYour profile needs to be updated.\n\nREASON: ${d.reason}\n\nPlease update your profile:\n${d.loginUrl}/employee/profile\n\n- TCS ION Admin`,

  customMessage: (d: { employeeName:string; message:string }) =>
    `*TCS ION MANPOWER*\n\nHi ${d.employeeName},\n\n${d.message}\n\n- TCS ION Admin`,

  welcomeInvite: (d: { fullName:string; phone:string; tempPassword:string; loginUrl:string }) =>
    `*TCS ION MANPOWER PORTAL*\n\nHello ${d.fullName},\n\nYou have been added to the TCS ION Manpower Portal.\n\nLOGIN: ${d.phone}\nPASSWORD: ${d.tempPassword}\n\nAccess your portal here:\n${d.loginUrl}/login\n\nPlease change your password after your first login.\n\n- TCS ION Admin`,
};

async function sendWhatsApp(toPhone: string, message: string): Promise<boolean> {
  const token   = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;

  if (!token || token.startsWith("your_") || !phoneId || phoneId.startsWith("your_")) {
    console.log(`[WhatsApp DEV] → ${toPhone}: ${message.slice(0, 80)}…`);
    return true;
  }

  try {
    const formatted = `91${toPhone.replace(/^(\+91|91|0)/, "").replace(/\D/g, "").slice(-10)}`;
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formatted,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });
    if (!res.ok) { const err = await res.json(); console.error("[WhatsApp API Error]:", err); return false; }
    return true;
  } catch (err) {
    console.error("[WhatsApp Network Error]:", err);
    return false;
  }
}

export async function notifyEmployee({ employeeId, toPhone, type, title, message }: {
  employeeId: string; toPhone: string; type: string; title: string; message: string;
}): Promise<boolean> {
  const supabase = createAdminClient();

  // Store notification in DB
  await supabase.from("notifications").insert({
    employee_id: employeeId, type, title, message,
    whatsapp_sent: false, read: false,
  }).then(null, () => {});

  const sent = await sendWhatsApp(toPhone, message);

  // Update WhatsApp status
  await supabase.from("notifications")
    .update({ whatsapp_sent: sent, whatsapp_status: sent ? "sent" : "failed" })
    .eq("employee_id", employeeId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(1)
    .then(null, () => {});

  return sent;
}
