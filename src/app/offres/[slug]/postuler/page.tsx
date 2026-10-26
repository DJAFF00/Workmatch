import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/apply-form";
import { CompanyLogo, JobsSkeleton } from "@/components/job-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { contractLabels, workModeLabels } from "@/lib/constants";
import { getJob } from "@/lib/queries";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  return { title: job ? `Postuler : ${job.title} – ${job.company.name}` : "Offre introuvable – WorkMatch", robots: { index: false } };
}

export default function PostulerPage({ params }: { params: Params }) {
  return (
    <>
      <SiteHeader active="offres" />
      <main className="mx-auto max-w-3xl px-5 pt-4">
        <Suspense fallback={<JobsSkeleton />}>
          <Content params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Content({ params }: { params: Params }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  // Les questions sont lues directement (sans cache) pour être toujours à jour.
  const [fresh] = await db.select({ q: jobs.customQuestions }).from(jobs).where(eq(jobs.slug, slug)).limit(1);

  return (
    <>
      <Link href={`/offres/${job.slug}`} className="text-sm font-semibold text-muted hover:text-orange">← Retour à l’offre</Link>
      <div className="mt-6 flex items-center gap-4">
        <CompanyLogo name={job.company.name} logo={job.company.logo} size="size-14 text-xl rounded-2xl" />
        <div>
          <h1 className="text-2xl font-extrabold sm:text-4xl">Postuler : {job.title}</h1>
          <p className="text-sm text-muted">{job.company.name} · {contractLabels[job.contract]} · {workModeLabels[job.workMode]} · {job.location}</p>
        </div>
      </div>
      <div className="mt-8">
        {job.expired ? (
          <p className="glass rounded-3xl p-10 text-center text-muted">Les candidatures sont closes pour cette offre.</p>
        ) : (
          <ApplyForm slug={job.slug} jobTitle={job.title} questions={fresh?.q ?? []} />
        )}
      </div>
    </>
  );
}
