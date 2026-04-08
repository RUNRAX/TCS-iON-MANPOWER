/**
 * lib/email/send.ts — Email sending service using Mailjet
 * Sender: rakshitawati7@gmail.com (configurable via env)
 */

const MAILJET_API_KEY = process.env.MAILJET_API_KEY || "f360cb341a4d293d6d034b26d2dd8610";
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY || "c169daa38bb8973bcb518961548e5004";
const FROM_EMAIL = process.env.FROM_EMAIL || "rakshitawati5@gmail.com";
const FROM_NAME = "TCS iON Portal";

interface SendEmailOpts {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOpts) {
  const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString('base64');
  
  const toArray = Array.isArray(to) ? to : [to];
  
  const response = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: FROM_EMAIL,
            Name: FROM_NAME
          },
          To: toArray.map(email => ({ Email: email })),
          Subject: subject,
          TextPart: text ?? html.replace(/<[^>]*>/g, ""),
          HTMLPart: html
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("[Email] Mailjet send failed:", errorData);
    throw new Error(`Email send failed: ${errorData}`);
  }

  const data = await response.json();
  return data;
}
