"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applicationNotes, applicationStatus, applications, companies, interviews, interviewMode, jobs } from "@/db/schema";
import { buildIcs, contactMessage, interviewInvitation } from "@/emails/templates";
import { interviewModeLabels } from "@/lib/constants";
import { formatLongDate, formatTime, wallClockNow } from "@/lib/format";
import { sendMail } from "@/lib/mail";
import { requireCompany } from "@/lib/session";
import type { ActionResult } from "@/lib/form-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const uuid = z.uuid();

// Charge une candidature SEULEMENT si elle appartient à l'entreprise connectée.
async function ownApplication(id: string) {
  const ctx = await requireCompany();
  if (!uuid.safeParse(id).success) return null;
  const [row] = await db
    .select({ app: applications, jobTitle: jobs.title })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(applications.id, id), eq(jobs.companyId, ctx.company.id)))
    .limit(1);
  return row ? { ...ctx, ...row } : null;
}

export async function setApplicationStatus(fd: FormData) {
  const status = z.enum(applicationStatus.enumValues).safeParse(str(fd, "status"));
  const own = await ownApplication(str(fd, "id"));
  if (!own || !status.success) return;
  await db.update(applications).set({ status: status.data }).where(eq(applications.id, own.app.id));
  refresh();
}

export async function setRating(fd: FormData) {
  const rating = z.coerce.number().int().min(0).max(5).safeParse(str(fd, "rating"));
  const own = await ownApplication(str(fd, "id"));
  if (!own || !rating.success) return;
  await db.update(applications).set({ rating: rating.data === 0 ? null : rating.data }).where(eq(applications.id, own.app.id));
  refresh();
}

export async function addNote(fd: FormData) {
  const content = z.string().min(1).max(2000).safeParse(str(fd, "content"));
  const own = await ownApplication(str(fd, "id"));
  if (!own || !content.success) return;
  await db.insert(applicationNotes).values({ applicationId: own.app.id, authorId: own.user.id, content: content.data });
  refresh();
}

export async function deleteNote(fd: FormData) {
  const noteId = uuid.safeParse(str(fd, "noteId"));
  const own = await ownApplication(str(fd, "id"));
  if (!own || !noteId.success) return;
  await db.delete(applicationNotes).where(
    and(eq(applicationNotes.id, noteId.data), eq(applicationNotes.applicationId, own.app.id), eq(applicationNotes.authorId, own.user.id)),
  );
  refresh();
}

const contactSchema = z.object({
  subject: z.string().min(3, "Indiquez l’objet du message.").max(150, "Objet trop long."),
  message: z.string().min(10, "Le message est trop court.").max(5000, "Le message est trop long."),
});

export async function sendContactEmail(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const own = await ownApplication(str(fd, "id"));
  if (!own) return { error: "Candidature introuvable." };
  const parsed = contactSchema.safeParse({ subject: str(fd, "subject"), message: str(fd, "message") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const mail = contactMessage({ company: own.company.name, subject: parsed.data.subject, body: parsed.data.message });
  const ok = await sendMail({
    to: own.app.email, ...mail, type: "contact", applicationId: own.app.id,
    replyTo: own.user.email, // le candidat répond directement au recruteur
  });
  if (!ok) return { error: "L’email n’a pas pu être envoyé. Vérifiez la configuration d’envoi (Resend)." };
  refresh();
  return { success: true };
}

const interviewSchema = z.object({
  jobTitle: z.string().min(2, "Indiquez l’intitulé du poste.").max(150),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez la date de l’entretien."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choisissez l’heure de l’entretien."),
  mode: z.enum(interviewMode.enumValues, { error: "Choisissez le format de l’entretien." }),
  place: z.string().max(300, "Lieu ou lien trop long.").optional(),
  message: z.string().max(2000, "Message trop long.").optional(),
});

export async function scheduleInterview(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const own = await ownApplication(str(fd, "id"));
  if (!own) return { error: "Candidature introuvable." };

  const parsed = interviewSchema.safeParse({
    jobTitle: str(fd, "jobTitle"), date: str(fd, "date"), time: str(fd, "time"), mode: str(fd, "mode"),
    place: str(fd, "place") || undefined, message: str(fd, "message") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.mode !== "TELEPHONE" && !d.place) return { error: d.mode === "VISIO" ? "Indiquez le lien de la visioconférence." : "Indiquez le lieu de l’entretien." };

  const scheduledAt = new Date(`${d.date}T${d.time}:00Z`); // heure saisie, stockée telle quelle
  if (Number.isNaN(scheduledAt.getTime())) return { error: "Date ou heure invalide." };
  if (scheduledAt <= wallClockNow()) return { error: "La date de l’entretien doit être dans le futur." };

  const [created] = await db.insert(interviews).values({
    applicationId: own.app.id, jobTitle: d.jobTitle, scheduledAt, mode: d.mode,
    locationOrLink: d.place ?? null, message: d.message ?? null,
  }).returning({ id: interviews.id });
  await db.update(applications).set({ status: "ENTRETIEN" }).where(eq(applications.id, own.app.id));

  const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, own.company.id)).limit(1);
  const mail = interviewInvitation({
    name: own.app.fullName, jobTitle: d.jobTitle, company: co.name, dateLabel: formatLongDate(scheduledAt),
    timeLabel: formatTime(scheduledAt), modeLabel: interviewModeLabels[d.mode], place: d.place, message: d.message,
  });
  const ics = buildIcs({
    id: created.id, start: scheduledAt, title: `Entretien – ${d.jobTitle} (${co.name})`, location: d.place,
    description: `Entretien pour le poste de ${d.jobTitle} chez ${co.name}.`,
  });
  const sent = await sendMail({
    to: own.app.email, ...mail, type: "entretien", applicationId: own.app.id,
    replyTo: own.user.email, attachments: [{ filename: "entretien.ics", content: Buffer.from(ics) }],
  });

  refresh();
  return sent
    ? { success: true }
    : { success: true, warning: "L’entretien est enregistré, mais l’email n’a pas pu être envoyé au candidat. Vérifiez la configuration d’envoi (Resend), ou prévenez-le directement." };
}

export async function cancelInterview(fd: FormData) {
  const { company } = await requireCompany();
  const id = uuid.safeParse(str(fd, "interviewId"));
  if (!id.success) return;
  const [row] = await db
    .select({ id: interviews.id })
    .from(interviews)
    .innerJoin(applications, eq(interviews.applicationId, applications.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(interviews.id, id.data), eq(jobs.companyId, company.id)))
    .limit(1);
  if (!row) return;
  await db.delete(interviews).where(eq(interviews.id, row.id));
  refresh();
}
