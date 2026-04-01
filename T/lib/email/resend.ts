/**
 * lib/email/resend.ts — Resend email client + sending helpers
 *
 * Free tier: 3000 emails/month, use onboarding@resend.dev as sender
 * Sign up: https://resend.com
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set.");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

// ─── Email sending helpers ─────────────────────────────────────────────────

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/** Welcome email on employee registration */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: "Welcome to TCS iON Staff Portal 🎉",
      html: welcomeTemplate(name),
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Shift opened notification for employees */
export async function sendShiftOpenedEmail(
  to: string,
  name: string,
  shiftDetails: { centre: string; date: string; time: string; deadline: string }
): Promise<SendEmailResult> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: `📅 New Shift Available — ${shiftDetails.centre}`,
      html: shiftOpenedTemplate(name, shiftDetails),
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Payment released notification */
export async function sendPaymentReleasedEmail(
  to: string,
  name: string,
  amount: number,
  shiftsCount: number
): Promise<SendEmailResult> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: `💰 Payment Released — ₹${amount.toLocaleString("en-IN")}`,
      html: paymentReleasedTemplate(name, amount, shiftsCount),
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── HTML Templates ────────────────────────────────────────────────────────

function baseTemplate(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #07070f; font-family: 'Segoe UI', Arial, sans-serif; color: #e8e8ff; }
    .container { max-width: 560px; margin: 40px auto; background: linear-gradient(145deg, #0d0b1e, #0a0818); border-radius: 20px; border: 1px solid rgba(99,102,241,0.2); overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 28px 36px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #fff; letter-spacing: 0.02em; }
    .header p { margin: 4px 0 0; font-size: 11px; color: rgba(255,255,255,0.75); letter-spacing: 0.1em; text-transform: uppercase; }
    .body { padding: 32px 36px; }
    .body p { font-size: 14px; line-height: 1.7; color: rgba(232,232,255,0.85); }
    .cta { display: inline-block; margin: 20px 0; padding: 12px 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { padding: 20px 36px; border-top: 1px solid rgba(99,102,241,0.12); text-align: center; font-size: 11px; color: rgba(200,200,230,0.4); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 20px; font-size: 11px; color: #a5b4fc; font-weight: 600; margin-bottom: 12px; }
    .info-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 20px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: rgba(200,200,230,0.5); }
    .info-value { color: #e8e8ff; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TCS iON Staff Portal</h1>
      <p>Exam Workforce Platform · India</p>
    </div>
    <div class="body">${bodyContent}</div>
    <div class="footer">TCS iON Staff Portal © ${new Date().getFullYear()} &nbsp;·&nbsp; This is an automated message. Do not reply.</div>
  </div>
</body>
</html>`;
}

function welcomeTemplate(name: string): string {
  return baseTemplate("Welcome to TCS iON", `
    <div class="badge">🎉 Registration Confirmed</div>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to the <strong>TCS iON Staff Portal</strong>! Your registration has been received and is pending admin verification.</p>
    <p>Once your profile is verified, you'll be able to:</p>
    <ul style="color:rgba(232,232,255,0.8);font-size:14px;line-height:2;">
      <li>Browse and apply for available exam shifts</li>
      <li>Track your attendance history</li>
      <li>View and download payment records</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="cta">Sign In to Portal →</a>
    <p style="font-size:12px;color:rgba(200,200,230,0.5);">If you did not register, please ignore this email.</p>
  `);
}

function shiftOpenedTemplate(name: string, shift: { centre: string; date: string; time: string; deadline: string }): string {
  return baseTemplate("New Shift Available", `
    <div class="badge">📅 New Shift Posted</div>
    <p>Hi <strong>${name}</strong>,</p>
    <p>A new exam shift has been posted that you may be eligible for. Log in to confirm your availability before slots fill up.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Exam Centre</span><span class="info-value">${shift.centre}</span></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${shift.date}</span></div>
      <div class="info-row"><span class="info-label">Shift Time</span><span class="info-value">${shift.time}</span></div>
      <div class="info-row"><span class="info-label">Confirm Before</span><span class="info-value">${shift.deadline}</span></div>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="cta">Confirm My Availability →</a>
  `);
}

function paymentReleasedTemplate(name: string, amount: number, shiftsCount: number): string {
  return baseTemplate("Payment Released", `
    <div class="badge">💰 Payment Processed</div>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your payment has been processed and released to your registered bank account.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Amount</span><span class="info-value" style="color:#34d399;font-size:18px;">₹${amount.toLocaleString("en-IN")}</span></div>
      <div class="info-row"><span class="info-label">Shifts Covered</span><span class="info-value">${shiftsCount} shift${shiftsCount > 1 ? "s" : ""}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:#34d399;">Released ✓</span></div>
    </div>
    <p style="font-size:12px;color:rgba(200,200,230,0.5);">Funds typically reflect within 2–3 business days depending on your bank.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="cta">View Payment Details →</a>
  `);
}
