// Gmail SMTP transport (server only). Uses an App Password — see .env.example.
// nodemailer is lazily created so missing env only errors when we actually send.
import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export const SENDER_NAME = "तमक by Bhavneet";

function getTransport(): Transporter {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Email not configured — set GMAIL_USER and GMAIL_APP_PASSWORD.");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  const from = `${SENDER_NAME} <${process.env.GMAIL_USER}>`;
  await getTransport().sendMail({ from, to, subject, html });
}
