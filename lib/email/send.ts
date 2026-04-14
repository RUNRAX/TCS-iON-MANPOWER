/**
 * lib/email/send.ts — Email sending service using Resend
 * Sender: onboarding@resend.dev (configurable via env)
 */
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_123";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = "TCS iON Portal";

const resend = new Resend(RESEND_API_KEY);

interface SendEmailOpts {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOpts) {
  const toArray = Array.isArray(to) ? to : [to];
  
  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: toArray,
    subject: subject,
    html: html,
    text: text ?? html.replace(/<[^>]*>/g, ""),
  });

  if (error) {
    console.error("[Email] Resend failed:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
