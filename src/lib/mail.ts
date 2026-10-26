import { Resend } from "resend";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";

export async function sendMail(opts: {
  to: string; subject: string; html: string; type: string; applicationId?: string;
  replyTo?: string; attachments?: { filename: string; content: Buffer }[];
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[mail] RESEND_API_KEY manquant : email non envoyé (${opts.subject})`);
    return false;
  }
  const from = process.env.EMAIL_FROM || "WorkMatch <onboarding@resend.dev>";
  try {
    const { error } = await new Resend(key).emails.send({
      from, to: opts.to, subject: opts.subject, html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      ...(opts.attachments ? { attachments: opts.attachments } : {}),
    });
    if (error) {
      console.error("[mail] échec d’envoi :", error.message);
      return false;
    }
    await db.insert(emailLogs).values({ applicationId: opts.applicationId ?? null, toEmail: opts.to, subject: opts.subject, type: opts.type });
    return true;
  } catch (e) {
    console.error("[mail] erreur :", e);
    return false;
  }
}
