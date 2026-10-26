import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Arrow } from "@/components/arrow";
import { CompanyLogo, JobsSkeleton } from "@/components/job-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewTracker } from "@/components/view-tracker";
import { contractLabels, workModeLabels } from "@/lib/constants";
import { formatDate, formatSalary, toLines, toParagraphs } from "@/lib/format";
import { getJob, type JobDetail } from "@/lib/queries";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Offre introuvable – WorkMatch" };
  return {
    title: `${job.title} – ${job.company.name}`,
    description: `${job.company.name} recrute : ${job.title} (${contractLabels[job.contract]}) à ${job.location}. Postulez en deux minutes.`,
  };
}

export default function OffrePage({ params }: { params: Params }) {
  return (
    <>
      <SiteHeader active="offres" />
      <main className="mx-auto max-w-6xl px-5 pt-4">
        <Link href="/offres" className="text-sm font-semibold text-muted hover:text-orange">← Toutes les offres</Link>
        <Suspense fallback={<JobsSkeleton />}>
          <Offre params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

const employmentType: Record<string, string> = {
  CDI: "FULL_TIME", CDD: "TEMPORARY", STAGE: "INTERN", FREELANCE: "CONTRACTOR", ALTERNANCE: "INTERN", TEMPS_PARTIEL: "PART_TIME",
};

function jsonLd(job: JobDetail) {
  const data = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [job.description, job.missions, job.requirements, job.benefits].filter(Boolean).join("\n\n"),
    datePosted: job.publishedAt,
    ...(job.deadline ? { validThrough: job.deadline } : {}),
    employmentType: employmentType[job.contract],
    hiringOrganization: { "@type": "Organization", name: job.company.name },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } },
    ...(job.workMode === "TELETRAVAIL" ? { jobLocationType: "TELECOMMUTE" } : {}),
    ...(job.salaryMin != null || job.salaryMax != null
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salaryCurrency ?? "XOF",
            value: { "@type": "QuantitativeValue", minValue: job.salaryMin ?? undefined, maxValue: job.salaryMax ?? undefined },
          },
        }
      : {}),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function Block({ title, lines }: { title: string; lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-3 text-muted"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange" />{l}</li>
        ))}
      </ul>
    </section>
  );
}

async function Offre({ params }: { params: Params }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const safeSite = job.company.website && /^https?:\/\//i.test(job.company.website) ? job.company.website : null;
  const facts = [
    ["Contrat", contractLabels[job.contract]],
    ["Mode de travail", workModeLabels[job.workMode]],
    ["Lieu", job.location],
    ...(job.experienceLevel ? [["Expérience", job.experienceLevel]] : []),
    ...(salary ? [["Rémunération", salary]] : []),
    ...(job.deadline ? [["Date limite", formatDate(job.deadline)]] : []),
  ];

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(job) }} />
      <ViewTracker slug={job.slug} />

      <article className="glass rounded-[2rem] p-6 sm:p-10">
        <div className="flex items-center gap-4">
          <CompanyLogo name={job.company.name} logo={job.company.logo} size="size-14 text-xl rounded-2xl" />
          <div>
            <Link href={`/entreprises/${job.company.slug}`} className="font-bold hover:text-orange">{job.company.name}</Link>
            <p className="text-sm text-muted">{job.company.sector}</p>
          </div>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold sm:text-5xl">{job.title}</h1>
        <p className="mt-2 text-sm text-muted">Publiée le {formatDate(job.publishedAt)}</p>

        <section className="mt-8 space-y-3 text-muted">
          {toParagraphs(job.description).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </section>
        <Block title="Missions" lines={toLines(job.missions)} />
        <Block title="Profil recherché" lines={toLines(job.requirements)} />
        <Block title="Avantages" lines={toLines(job.benefits)} />
      </article>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <div className="glass rounded-[2rem] p-6">
          {job.expired ? (
            <p className="rounded-2xl bg-orange-soft px-4 py-3 text-center text-sm font-semibold text-orange-deep">Les candidatures sont closes pour cette offre.</p>
          ) : (
            <Link href={`/offres/${job.slug}/postuler`} className="flex items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] hover:bg-orange-deep">
              Postuler à cette offre <Arrow />
            </Link>
          )}
          <p className="mt-3 text-center text-xs text-muted">Sans compte · environ 2 minutes</p>
          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-muted">À propos de l’entreprise</p>
          <Link href={`/entreprises/${job.company.slug}`} className="mt-1 block text-lg font-extrabold hover:text-orange">{job.company.name}</Link>
          {job.company.description && <p className="mt-2 line-clamp-4 text-sm text-muted">{job.company.description}</p>}
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href={`/entreprises/${job.company.slug}`} className="text-orange">Toutes ses offres</Link>
            {safeSite && <a href={safeSite} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink">Site web</a>}
          </div>
        </div>
      </aside>
    </div>
  );
}
