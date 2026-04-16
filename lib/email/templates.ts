/**
 * lib/email/templates.ts — HTML email templates
 * Branded TCS iON Manpower Portal emails
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3018";

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background:#0a0a14; color:#e8eeff; }
  .container { max-width:560px; margin:0 auto; padding:40px 24px; }
  .card { background:linear-gradient(135deg,rgba(20,18,40,0.95),rgba(30,25,55,0.90)); border:1px solid rgba(255,255,255,0.12); border-radius:24px; padding:40px 32px; box-shadow:0 24px 48px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.12); }
  .logo { text-align:center; margin-bottom:28px; }
  .logo-badge { display:inline-block; padding:10px 18px; border-radius:14px; background:linear-gradient(135deg,#e0550b,#b63b07); color:#fff; font-weight:800; font-size:14px; letter-spacing:0.5px; }
  .logo-sub { font-size:10px; letter-spacing:3px; color:#e0550b; margin-top:6px; text-transform:uppercase; }
  h1 { font-size:22px; font-weight:700; margin:0 0 8px; color:#f0eeff; }
  h2 { font-size:16px; font-weight:600; margin:0 0 16px; color:rgba(200,195,240,0.8); }
  .field { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 16px; margin-bottom:10px; }
  .field-label { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(200,195,240,0.45); margin-bottom:4px; }
  .field-value { font-size:15px; font-weight:600; color:#f0eeff; word-break:break-all; }
  .btn { display:inline-block; padding:14px 32px; border-radius:14px; background:linear-gradient(135deg,#e0550b,#b63b07); color:#fff; text-decoration:none; font-weight:700; font-size:15px; letter-spacing:0.3px; margin-top:20px; box-shadow:0 8px 24px rgba(224,85,11,0.35); }
  .footer { text-align:center; margin-top:28px; font-size:12px; color:rgba(200,195,240,0.35); }
  .divider { height:1px; background:rgba(255,255,255,0.08); margin:24px 0; }
  .warning { background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.18); border-radius:10px; padding:12px 16px; font-size:13px; color:#fbbf24; margin-top:16px; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="logo">
      <div class="logo-badge">TCS iON</div>
      <div class="logo-sub">Manpower Portal</div>
    </div>
    ${body}
  </div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} TCS iON Manpower Portal</p>
    <p>This is an automated message. Do not reply to this email.</p>
  </div>
</div>
</body>
</html>`;
}

/** Employee welcome email with login credentials */
export function employeeWelcomeEmail(opts: {
  fullName: string;
  email: string;
  phone: string;
  employeeCode: string;
  tempPassword: string;
}): { subject: string; html: string } {
  return {
    subject: `Welcome to TCS iON Portal — Your Login Credentials`,
    html: baseTemplate("Welcome", `
      <h1>Welcome, ${opts.fullName}! 👋</h1>
      <h2>You've been added to the TCS iON Manpower Portal</h2>
      <div class="divider"></div>
      <div class="field">
        <div class="field-label">Employee ID</div>
        <div class="field-value">${opts.employeeCode}</div>
      </div>
      <div class="field">
        <div class="field-label">Email (Login)</div>
        <div class="field-value">${opts.email}</div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${opts.phone}</div>
      </div>
      <div class="field">
        <div class="field-label">Temporary Password</div>
        <div class="field-value" style="color:#e0550b;font-family:monospace;font-size:18px;">${opts.tempPassword}</div>
      </div>
      <div style="text-align:center;">
        <a href="${APP_URL}/login" class="btn">Login to Portal →</a>
      </div>
      <div class="warning">
        ⚠️ Please complete your profile after logging in. Keep your credentials safe.
      </div>
    `),
  };
}

/** Password reset email */
export function passwordResetEmail(opts: {
  fullName: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Password Reset — TCS iON Portal`,
    html: baseTemplate("Password Reset", `
      <h1>Password Reset Request</h1>
      <h2>Hi ${opts.fullName}, we received a request to reset your password.</h2>
      <div class="divider"></div>
      <p style="font-size:14px;color:rgba(200,195,240,0.7);line-height:1.6;">
        Click the button below to set a new password. This link will expire in 1 hour.
      </p>
      <div style="text-align:center;">
        <a href="${opts.resetUrl}" class="btn">Reset Password →</a>
      </div>
      <div class="warning">
        ⚠️ If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.
      </div>
      <p style="font-size:12px;color:rgba(200,195,240,0.35);margin-top:16px;word-break:break-all;">
        Or copy this link: ${opts.resetUrl}
      </p>
    `),
  };
}

/** Verification email */
export function verificationEmail(opts: {
  fullName: string;
  verificationUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Verify your Email — TCS iON Portal`,
    html: baseTemplate("Email Verification", `
      <h1>Account Verification 🛡️</h1>
      <h2>Hi ${opts.fullName}, please verify your email address to secure your account.</h2>
      <div class="divider"></div>
      <p style="font-size:14px;color:rgba(200,195,240,0.7);line-height:1.6;">
        Click the button below to verify your email. This link logs you into your account directly, formally concluding the verification process.
      </p>
      <div style="text-align:center;">
        <a href="${opts.verificationUrl}" class="btn">Verify Email →</a>
      </div>
      <p style="font-size:12px;color:rgba(200,195,240,0.35);margin-top:16px;word-break:break-all;">
        Or copy this link: ${opts.verificationUrl}
      </p>
    `),
  };
}

/** Shift broadcast email */
export function shiftBroadcastEmail(opts: {
  employeeName: string;
  shiftTitle: string;
  examDate: string;
  shiftNumber: number;
  startTime: string;
  endTime: string;
  venue: string;
  customMessage?: string;
}): { subject: string; html: string } {
  return {
    subject: `Shift Assignment — ${opts.shiftTitle} (${opts.examDate})`,
    html: baseTemplate("Shift Assignment", `
      <h1>Shift Assignment 📋</h1>
      <h2>Hi ${opts.employeeName}, you have a new shift assignment.</h2>
      <div class="divider"></div>
      <div class="field">
        <div class="field-label">Exam</div>
        <div class="field-value">${opts.shiftTitle}</div>
      </div>
      <div style="display:flex;gap:10px;">
        <div class="field" style="flex:1;">
          <div class="field-label">Date</div>
          <div class="field-value">${opts.examDate}</div>
        </div>
        <div class="field" style="flex:1;">
          <div class="field-label">Shift</div>
          <div class="field-value">#${opts.shiftNumber}</div>
        </div>
      </div>
      <div class="field">
        <div class="field-label">Timing</div>
        <div class="field-value">${opts.startTime} – ${opts.endTime}</div>
      </div>
      <div class="field">
        <div class="field-label">Venue</div>
        <div class="field-value">${opts.venue}</div>
      </div>
      ${opts.customMessage ? `
      <div class="divider"></div>
      <p style="font-size:14px;color:rgba(200,195,240,0.7);line-height:1.6;">
        ${opts.customMessage}
      </p>` : ""}
      <div style="text-align:center;">
        <a href="${APP_URL}/employee/shifts" class="btn">View My Shifts →</a>
      </div>
    `),
  };
}
