import { cacheLife, cacheTag } from "next/cache";
import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, jobs } from "@/db/schema";
import { logoSrc } from "@/lib/logo";

// Toutes les lectures publiques sont mises en cache quelques minutes (tag "jobs").
// Le dashboard invalide ce cache dès qu'une offre change (voir job-actions.ts).

export type PublicJob = {
  slug: string; title: string; contract: string; workMode: string; location: string;
  publishedAt: string; company: string; companySlug: string; sector: string; logo: string | null;
};

export type JobDetail = {
  slug: string; title: string; description: string;
  missions: string | null; requirements: string | null; benefits: string | null;
  contract: string; workMode: string; location: string; experienceLevel: string | null;
  salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null;
  deadline: string | null; publishedAt: string; expired: boolean;
  company: { name: string; slug: string; sector: string; size: string | null; city: string | null; website: string | null; description: string | null; logo: string | null };
};

export type CompanyProfile = {
  name: string; slug: string; sector: string; size: string | null; city: string | null;
  website: string | null; description: string | null; logo: string | null; jobs: PublicJob[];
};

const live = and(eq(jobs.status, "PUBLIEE"), or(isNull(jobs.deadline), gte(jobs.deadline, sql`now()`)));

const listColumns = {
  slug: jobs.slug, title: jobs.title, contract: jobs.contract, workMode: jobs.workMode,
  location: jobs.location, publishedAt: jobs.publishedAt,
  company: companies.name, companySlug: companies.slug, sector: companies.sector, logoPath: companies.logoUrl,
};

function toPublic({ logoPath, ...r }: { publishedAt: Date | null; logoPath: string | null } & Omit<PublicJob, "publishedAt" | "logo">): PublicJob {
  return { ...r, publishedAt: (r.publishedAt ?? new Date(0)).toISOString(), logo: logoSrc(r.companySlug, logoPath) };
}

export async function getPublishedJobs(limit: number): Promise<PublicJob[]> {
  "use cache";
  cacheTag("jobs");
  cacheLife("minutes");

  const rows = await db.select(listColumns).from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(live).orderBy(desc(jobs.publishedAt)).limit(limit);
  return rows.map(toPublic);
}

export async function getJob(slug: string): Promise<JobDetail | null> {
  "use cache";
  cacheTag("jobs");
  cacheLife("minutes");

  const [r] = await db
    .select({
      job: jobs,
      expired: sql<boolean>`(${jobs.deadline} is not null and ${jobs.deadline} < now())`,
      company: {
        name: companies.name, slug: companies.slug, sector: companies.sector, size: companies.size,
        city: companies.city, website: companies.website, description: companies.description, logoPath: companies.logoUrl,
      },
    })
    .from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(jobs.slug, slug), eq(jobs.status, "PUBLIEE"))).limit(1);
  if (!r) return null;

  const j = r.job;
  return {
    slug: j.slug, title: j.title, description: j.description, missions: j.missions, requirements: j.requirements, benefits: j.benefits,
    contract: j.contract, workMode: j.workMode, location: j.location, experienceLevel: j.experienceLevel,
    salaryMin: j.salaryMin, salaryMax: j.salaryMax, salaryCurrency: j.salaryCurrency,
    deadline: j.deadline ? j.deadline.toISOString() : null,
    publishedAt: (j.publishedAt ?? j.createdAt).toISOString(),
    expired: Boolean(r.expired),
    company: { name: r.company.name, slug: r.company.slug, sector: r.company.sector, size: r.company.size, city: r.company.city, website: r.company.website, description: r.company.description, logo: logoSrc(r.company.slug, r.company.logoPath) },
  };
}

export async function getCompany(slug: string): Promise<CompanyProfile | null> {
  "use cache";
  cacheTag("jobs");
  cacheLife("minutes");

  const [c] = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
  if (!c) return null;

  const rows = await db.select(listColumns).from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(live, eq(jobs.companyId, c.id))).orderBy(desc(jobs.publishedAt));

  return { name: c.name, slug: c.slug, sector: c.sector, size: c.size, city: c.city, website: c.website, description: c.description, logo: logoSrc(c.slug, c.logoUrl), jobs: rows.map(toPublic) };
}
