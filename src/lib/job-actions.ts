"use server";

import { redirect } from "next/navigation";
import { refresh, revalidatePath, updateTag } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { contractType, jobStatus, jobs, workMode } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { slugify } from "@/lib/utils";
import type { JobFormState } from "@/lib/form-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optionalInt = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number("Le salaire doit être un nombre.").int().min(0, "Le salaire ne peut pas être négatif.").max(1_000_000_000, "Montant trop élevé.").optional(),
);

const jobSchema = z.object({
  title: z.string().min(3, "Le titre du poste est trop court."),
  contract: z.enum(contractType.enumValues, { error: "Choisissez un type de contrat." }),
  workMode: z.enum(workMode.enumValues, { error: "Choisissez un mode de travail." }),
  location: z.string().min(2, "Indiquez le lieu du poste."),
  experienceLevel: z.string().optional(),
  description: z.string().min(30, "Décrivez le poste en quelques phrases (30 caractères minimum)."),
  missions: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  salaryMin: optionalInt,
  salaryMax: optionalInt,
  salaryCurrency: z.string().default("XOF"),
  deadline: z.string().optional(),
  questions: z.array(z.object({
    id: z.string().min(1).max(64),
    label: z.string().min(3, "Une question personnalisée est trop courte.").max(200, "Une question personnalisée est trop longue."),
    required: z.boolean(),
  })).max(8, "8 questions personnalisées maximum."),
});

function readQuestions(fd: FormData) {
  try {
    const raw = JSON.parse(String(fd.get("questions") ?? "[]"));
    if (!Array.isArray(raw)) return [];
    return raw
      .map((q) => ({ id: String(q?.id ?? ""), label: String(q?.label ?? "").trim(), required: Boolean(q?.required) }))
      .filter((q) => q.label.length > 0);
  } catch {
    return [];
  }
}

export async function saveJob(_: JobFormState, fd: FormData): Promise<JobFormState> {
  const { company } = await requireCompany();
  const fields = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const fail = (error: string): JobFormState => ({ error, fields });

  const parsed = jobSchema.safeParse({
    title: str(fd, "title"),
    contract: str(fd, "contract"),
    workMode: str(fd, "workMode"),
    location: str(fd, "location"),
    experienceLevel: str(fd, "experienceLevel") || undefined,
    description: str(fd, "description"),
    missions: str(fd, "missions") || undefined,
    requirements: str(fd, "requirements") || undefined,
    benefits: str(fd, "benefits") || undefined,
    salaryMin: str(fd, "salaryMin"),
    salaryMax: str(fd, "salaryMax"),
    salaryCurrency: str(fd, "salaryCurrency") || "XOF",
    deadline: str(fd, "deadline") || undefined,
    questions: readQuestions(fd),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  if (d.salaryMin != null && d.salaryMax != null && d.salaryMin > d.salaryMax) {
    return fail("Le salaire minimum dépasse le salaire maximum.");
  }

  let deadline: Date | null = null;
  if (d.deadline) {
    deadline = new Date(`${d.deadline}T23:59:59`);
    if (Number.isNaN(deadline.getTime())) return fail("Date limite invalide.");
  }

  const intent = str(fd, "intent"); // draft | publish | keep
  if (intent === "publish" && deadline && deadline < new Date()) return fail("La date limite est déjà passée.");

  const values = {
    title: d.title,
    description: d.description,
    missions: d.missions ?? null,
    requirements: d.requirements ?? null,
    benefits: d.benefits ?? null,
    contract: d.contract,
    workMode: d.workMode,
    location: d.location,
    experienceLevel: d.experienceLevel ?? null,
    salaryMin: d.salaryMin ?? null,
    salaryMax: d.salaryMax ?? null,
    salaryCurrency: d.salaryCurrency,
    deadline,
    customQuestions: d.questions,
    updatedAt: new Date(),
  };

  const id = str(fd, "id");
  if (id) {
    if (!z.uuid().safeParse(id).success) return fail("Offre introuvable.");
    const [existing] = await db.select({ status: jobs.status, publishedAt: jobs.publishedAt }).from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.companyId, company.id))).limit(1);
    if (!existing) return fail("Offre introuvable.");

    const status = intent === "publish" ? "PUBLIEE" : intent === "draft" ? "BROUILLON" : existing.status;
    await db.update(jobs).set({
      ...values,
      status,
      publishedAt: status === "PUBLIEE" && !existing.publishedAt ? new Date() : existing.publishedAt,
    }).where(and(eq(jobs.id, id), eq(jobs.companyId, company.id)));
  } else {
    const status = intent === "publish" ? "PUBLIEE" : "BROUILLON";
    const slug = `${slugify(d.title).slice(0, 60)}-${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(jobs).values({
      ...values,
      companyId: company.id,
      slug,
      status,
      publishedAt: status === "PUBLIEE" ? new Date() : null,
    });
  }

  updateTag("jobs");
  revalidatePath("/dashboard/offres");
  redirect("/dashboard/offres");
}

const idSchema = z.uuid();

export async function setJobStatus(fd: FormData) {
  const { company } = await requireCompany();
  const id = idSchema.safeParse(str(fd, "id"));
  const status = z.enum(jobStatus.enumValues).safeParse(str(fd, "status"));
  if (!id.success || !status.success) return;

  await db.update(jobs).set({
    status: status.data,
    updatedAt: new Date(),
    ...(status.data === "PUBLIEE" ? { publishedAt: sql`coalesce(${jobs.publishedAt}, now())` } : {}),
  }).where(and(eq(jobs.id, id.data), eq(jobs.companyId, company.id)));
  updateTag("jobs");
  refresh();
}

export async function duplicateJob(fd: FormData) {
  const { company } = await requireCompany();
  const id = idSchema.safeParse(str(fd, "id"));
  if (!id.success) return;

  const [src] = await db.select().from(jobs).where(and(eq(jobs.id, id.data), eq(jobs.companyId, company.id))).limit(1);
  if (!src) return;

  await db.insert(jobs).values({
    companyId: company.id,
    title: `${src.title} (copie)`,
    slug: `${slugify(src.title).slice(0, 60)}-${Math.random().toString(36).slice(2, 7)}`,
    description: src.description,
    missions: src.missions,
    requirements: src.requirements,
    benefits: src.benefits,
    contract: src.contract,
    workMode: src.workMode,
    location: src.location,
    salaryMin: src.salaryMin,
    salaryMax: src.salaryMax,
    salaryCurrency: src.salaryCurrency,
    experienceLevel: src.experienceLevel,
    deadline: null,
    customQuestions: src.customQuestions,
    status: "BROUILLON",
  });
  updateTag("jobs");
  refresh();
}

export async function deleteJob(fd: FormData) {
  const { company } = await requireCompany();
  const id = idSchema.safeParse(str(fd, "id"));
  if (!id.success) return;
  await db.delete(jobs).where(and(eq(jobs.id, id.data), eq(jobs.companyId, company.id)));
  updateTag("jobs");
  refresh();
}
