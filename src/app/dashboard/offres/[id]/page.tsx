import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/dashboard-ui";
import { JobForm } from "@/components/job-form";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;

export const metadata = { title: "Modifier l’offre – WorkMatch" };

export default async function ModifierOffrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { company } = await requireCompany();
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, id), eq(jobs.companyId, company.id))).limit(1);
  if (!job) notFound();

  const initial = {
    id: job.id,
    title: job.title,
    contract: job.contract,
    workMode: job.workMode,
    location: job.location,
    experienceLevel: job.experienceLevel ?? "",
    description: job.description,
    missions: job.missions ?? "",
    requirements: job.requirements ?? "",
    benefits: job.benefits ?? "",
    salaryMin: job.salaryMin?.toString() ?? "",
    salaryMax: job.salaryMax?.toString() ?? "",
    salaryCurrency: job.salaryCurrency ?? "XOF",
    deadline: job.deadline ? job.deadline.toISOString().slice(0, 10) : "",
  };

  return (
    <>
      <PageHeader title="Modifier l’offre" subtitle={job.title} />
      <JobForm initial={initial} initialQuestions={job.customQuestions ?? []} status={job.status} />
    </>
  );
}
