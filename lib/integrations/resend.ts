import { Resend } from "resend";

export async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  bodyHtml: string,
  fromName = "Operant AI",
  replyTo?: string
): Promise<string> {
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: `${fromName} <onboarding@resend.dev>`,
    to: to.split(",").map((e) => e.trim()),
    subject,
    html: bodyHtml,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });

  if (error) throw new Error(error.message);

  return `Email sent to ${to} with subject "${subject}"`;
}
