import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationStatus, applications, jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { applicationStatusLabels } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { statusPill } from "@/lib/status-style";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;
export const metadata = { title: "Candidatures – WorkMatch" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function CandidaturesPage({ searchParams }: { searchParams: SP }) {
  const { company } = await requireCompany();
  const sp = await searchParams;
  const pick = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const statut = (applicationStatus.enumValues as readonly string[]).includes(pick("statut")) ? pick("statut") : "";
  const offre = /^[0-9a-f-]{36}$/i.test(pick("offre")) ? pick("offre") : "";

  const mine = eq(jobs.companyId, company.id);
  const [rows, counts, myJobs] = await Promise.all([
    db.select({
        id: applications.id, fullName: applications.fullName, email: applications.email, phone: applications.phone,
        city: applications.city, status: applications.status, rating: applications.rating, createdAt: applications.createdAt, jobTitle: jobs.title,
      })
      .from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(mine, offre ? eq(jobs.id, offre) : undefined, statut ? eq(applications.status, statut as (typeof applicationStatus.enumValues)[number]) : undefined))
      .orderBy(desc(applications.createdAt)).limit(100),
    db.select({ status: applications.status, n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(mine, offre ? eq(jobs.id, offre) : undefined)).groupBy(applications.status),
    db.select({ id: jobs.id, title: jobs.title }).from(jobs).where(mine).orderBy(desc(jobs.createdAt)),
  ]);

  const total = counts.reduce((n, c) => n + c.n, 0);
  const countOf = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const href = (s: string) => `/dashboard/candidatures?${new URLSearchParams({ ...(s ? { statut: s } : {}), ...(offre ? { offre } : {}) })}`;
  const tabs: [string, string, number][] = [["", "Toutes", total], ...applicationStatus.enumValues.map((s) => [s, applicationStatusLabels[s], countOf(s)] as [string, string, number])];

  return (
    <>
      <PageHeader title="Candidatures" subtitle="Les dossiers reçus pour vos offres, du plus récent au plus ancien." />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {tabs.map(([s, label, n]) => (
          <Link key={s || "all"} href={href(s)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statut === s ? "bg-orange text-white" : "glass hover:text-orange"}`}>
            {label} <span className="opacity-70">{n}</span>
          </Link>
        ))}
      </div>
      <form className="mt-4 flex flex-wrap items-center gap-2">
        {statut && <input type="hidden" name="statut" value={statut} />}
        <select name="offre" defaultValue={offre} aria-label="Filtrer par offre" className="glass rounded-full px-4 py-2 text-sm font-semibold outline-none">
          <option value="">Toutes les offres</option>
          {myJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-line hover:ring-orange">Filtrer</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={total === 0 ? "Aucune candidature pour l’instant" : "Aucun résultat"} text={total === 0 ? "Dès qu’une personne postule à l’une de vos offres, elle apparaît ici." : "Essayez un autre statut ou une autre offre."} />
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((a) => (
            <li key={a.id}>
              <Link href={`/dashboard/candidatures/${a.id}`} className="glass block rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-16px_rgba(255,90,15,.3)] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold">{a.fullName}</p>
                    <p className="text-sm text-muted">Pour : <span className="font-semibold text-ink">{a.jobTitle}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.rating && <span className="text-sm font-bold text-orange" aria-label={`Note ${a.rating} sur 5`}>{"★".repeat(a.rating)}</span>}
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusPill[a.status]}`}>{applicationStatusLabels[a.status]}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted">{a.email}{a.phone && <> · {a.phone}</>}{a.city && <> · {a.city}</>} · reçue le {formatDateTime(a.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
