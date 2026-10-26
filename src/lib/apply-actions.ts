"use server";

import { after } from "next/server";
import { and, eq, isNull, or, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, companies, companyMembers, jobs, user } from "@/db/schema";
import { applicationReceived, newApplicationNotice } from "@/emails/templates";
import { sendMail } from "@/lib/mail";
import { MAX_DIPLOMAS, MAX_TOTAL_BYTES, checkFile, removeFiles, storageConfigured, uploadPrivate, type CheckedFile } from "@/lib/storage";
import type { ApplyState } from "@/lib/form-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const isFile = (v: FormDataEntryValue): v is File => typeof v !== "string" && v.size > 0;

const schema = z.object({
  fullName: z.string().min(2, "Indiquez votre nom complet.").max(120),
  email: z.email("Adresse email invalide."),
  phone: z.string().max(30, "Numéro de téléphone trop long.").optional(),
  city: z.string().max(80).optional(),
  coverLetter: z.string().max(3000, "La lettre de motivation est trop longue (3000 caractères max).").optional(),
});

export async function submitApplication(_: ApplyState, fd: FormData): Promise<ApplyState> {
  // Champ piège invisible : un robot le remplit, une personne non.
  if (str(fd, "website_url")) return { success: true };

  const fields = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const fail = (error: string): ApplyState => ({ error, fields });

  // 1. L'offre doit exister, être publiée et encore ouverte (lecture directe, sans cache).
  const [row] = await db
    .select({ job: jobs, companyName: companies.name })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(jobs.slug, str(fd, "slug")), eq(jobs.status, "PUBLIEE"), or(isNull(jobs.deadline), gte(jobs.deadline, sql`now()`))))
    .limit(1);
  if (!row) return fail("Cette offre n’est plus disponible.");
  const { job, companyName } = row;

  // 2. Informations du candidat
  const parsed = schema.safeParse({
    fullName: str(fd, "fullName"),
    email: str(fd, "email").toLowerCase(),
    phone: str(fd, "phone") || undefined,
    city: str(fd, "city") || undefined,
    coverLetter: str(fd, "coverLetter") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  if (fd.get("consent") !== "on") return fail("Vous devez accepter le traitement de vos données pour postuler.");

  // 3. Questions personnalisées de l'entreprise
  const answers: Record<string, string> = {};
  for (const q of job.customQuestions ?? []) {
    const a = str(fd, `q_${q.id}`).slice(0, 1000);
    if (q.required && !a) return fail(`Répondez à la question : « ${q.label} »`);
    if (a) answers[q.label] = a;
  }

  // 4. Fichiers : CV obligatoire, diplômes facultatifs
  const cvEntry = fd.get("cv");
  if (!cvEntry || !isFile(cvEntry)) return fail("Joignez votre CV.");
  const diplomaEntries = fd.getAll("diplomas").filter(isFile);
  if (diplomaEntries.length > MAX_DIPLOMAS) return fail(`Vous pouvez joindre ${MAX_DIPLOMAS} diplômes au maximum.`);
  const all = [cvEntry, ...diplomaEntries];
  if (all.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) return fail("Les fichiers dépassent 4 Mo au total. Réduisez leur taille.");

  const checked: CheckedFile[] = [];
  for (const f of all) {
    const c = await checkFile(f);
    if (!c) return fail(`Format non accepté pour « ${f.name} ». Utilisez PDF, Word (doc, docx), JPG ou PNG.`);
    checked.push(c);
  }
  if (!storageConfigured()) return fail("L’envoi de fichiers n’est pas encore configuré sur ce site. Réessayez plus tard.");

  // 5. Pas de doublon pour le même email
  const [dup] = await db.select({ id: applications.id }).from(applications)
    .where(and(eq(applications.jobId, job.id), eq(applications.email, d.email))).limit(1);
  if (dup) return fail("Vous avez déjà postulé à cette offre avec cet email.");

  // 6. Envoi des fichiers (privés), puis enregistrement
  const folder = crypto.randomUUID();
  const uploaded: string[] = [];
  try {
    uploaded.push(await uploadPrivate(checked[0], folder, "cv"));
    for (let i = 1; i < checked.length; i++) uploaded.push(await uploadPrivate(checked[i], folder, `diplome-${i}`));
  } catch (e) {
    console.error("[candidature] échec d’envoi des fichiers", e);
    await removeFiles(uploaded);
    return fail("L’envoi des fichiers a échoué. Réessayez dans un instant.");
  }

  let applicationId: string;
  try {
    const [created] = await db.insert(applications).values({
      jobId: job.id,
      fullName: d.fullName,
      email: d.email,
      phone: d.phone ?? null,
      city: d.city ?? null,
      cvUrl: uploaded[0],
      diplomaUrls: uploaded.slice(1),
      coverLetter: d.coverLetter ?? null,
      answers,
      consent: true,
    }).returning({ id: applications.id });
    applicationId = created.id;
  } catch (e) {
    console.error("[candidature] échec d’enregistrement", e);
    await removeFiles(uploaded);
    return fail("Votre candidature n’a pas pu être enregistrée. Si vous avez déjà postulé, elle est peut-être déjà prise en compte.");
  }

  // 7. Emails après la réponse : le candidat n'attend pas.
  after(async () => {
    const mine = applicationReceived({ name: d.fullName, jobTitle: job.title, company: companyName, jobSlug: job.slug });
    await sendMail({ to: d.email, ...mine, type: "accuse", applicationId });

    const recipients = await db.select({ email: user.email }).from(companyMembers)
      .innerJoin(user, eq(companyMembers.userId, user.id)).where(eq(companyMembers.companyId, job.companyId));
    const notice = newApplicationNotice({ candidate: d.fullName, jobTitle: job.title });
    for (const r of recipients) await sendMail({ to: r.email, ...notice, type: "notification", applicationId });
  });

  return { success: true };
}
