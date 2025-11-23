import nodemailer from "nodemailer";

const SMTP_HOST = process.env.NEXT_PUBLIC_EMAIL_HOST || "smtp.example.com";
const SMTP_PORT = Number(process.env.NEXT_PUBLIC_EMAIL_PORT || 587);
const SMTP_USER = process.env.NEXT_PUBLIC_EMAIL_USER || "dummy@example.com";
const SMTP_PASS = process.env.NEXT_PUBLIC_EMAIL_PASSWORD || "dummy-password";

const FROM_EMAIL =
  process.env.NEXT_PUBLIC_EMAIL_FROM ||
  "Finance Manager <no-reply@example.com>";

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendMonthlyReportEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!options.to) return;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
