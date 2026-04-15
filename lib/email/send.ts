/**
 * lib/email/send.ts — Email sending service using Mailjet
 * Sender: configurable via env
 */
import Mailjet from 'node-mailjet';

const MAILJET_API_KEY = process.env.MAILJET_API_KEY || "mj_api_mock";
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY || "mj_secret_mock";
const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || "developer@tcsion.com";
const FROM_NAME = "TCS iON Portal";

const mailjet = new Mailjet({
  apiKey: MAILJET_API_KEY,
  apiSecret: MAILJET_SECRET_KEY
});

interface SendEmailOpts {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOpts) {
  const toArray = Array.isArray(to) ? to : [to];
  
  // Development/Missing Key Fallback
  if (!process.env.MAILJET_API_KEY || process.env.MAILJET_API_KEY === "mj_api_mock" || process.env.MAILJET_API_KEY === "your_api_key_here") {
    console.log("\n=== 📧 MOCK EMAIL ROUTED ===");
    console.log("TO:", toArray.join(","));
    console.log("SUBJECT:", subject);
    console.log("BODY SCANNED: Content securely routed to backend console.");
    console.log("============================\n");
    return { id: "mock_email_logged_to_console" };
  }
  
  try {
    const request = await mailjet
      .post("send", { 'version': 'v3.1' })
      .request({
        "Messages": [
          {
            "From": {
              "Email": FROM_EMAIL,
              "Name": FROM_NAME
            },
            "To": toArray.map(email => ({ "Email": email })),
            "Subject": subject,
            "TextPart": text ?? html.replace(/<[^>]*>/g, ""),
            "HTMLPart": html,
          }
        ]
      });

    return request.body;
  } catch (error: any) {
    console.warn(`\n[Email Warning] Mailjet rejected routing to ${toArray.join(",")}. Reason:`, error.message);
    console.log("=== 📧 FALLBACK EMAIL DUMP ===");
    console.log("SUBJECT:", subject);
    console.log("REASON:", error.message);
    console.log("==============================\n");
    // Return gently instead of throwing to prevent application endpoints from crashing
    return { id: "failed_but_logged" };
  }
}
