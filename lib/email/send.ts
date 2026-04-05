/**
 * lib/email/send.ts — Email sending service using Resend
 * Sender: rakshitawati7@gmail.com (configurable via env)
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = "TCS iON Portal";

interface SendEmailOpts {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOpts) {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ""),
  });

  if (error) {
    console.error("[Email] Send failed:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
