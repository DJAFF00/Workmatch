import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, interviews, jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { interviewModeLabels } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;
export const metadata = { title: "Entretiens – WorkMatch" };

export default async function EntretiensPage() {
  const { company } = await requireCompany();
  const rows = await db
    .select({
      id: interviews.id, appId: applications.id, name: applications.fullName, jobTitle: interviews.jobTitle,
      at: interviews.scheduledAt, mode: interviews.mode, place: interviews.locationOrLink,
      upcoming: sql<boolean>`${interviews.scheduledAt} >= (now() at time zone 'Africa/Porto-Novo')`,
    })
    .from(interviews)
    .innerJoin(applications, eq(interviews.applicationId, applications.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(jobs.companyId, company.id))
    .orderBy(asc(interviews.scheduledAt));

  const upcoming = rows.filter((r) => r.upcoming);
  const past = rows.filter((r) => !r.upcoming).reverse();

  const renderList = (items: typeof rows) => (
    <ul className="mt-4 space-y-3">
      {items.map((r) => (
        <li key={r.id}>
          <Link href={`/dashboard/candidatures/${r.appId}`} className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5 transition hover:-translate-y-0.5">
            <div>
              <p className="text-lg font-extrabold">{formatDateTime(r.at)}</p>
              <p className="text-sm text-muted"><span className="font-semibold text-ink">{r.name}</span> · {r.jobTitle}</p>
            </div>
            <p className="rounded-full bg-orange-soft px-3 py-1 text-xs font-bold text-orange-deep">{interviewModeLabels[r.mode]}</p>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader title="Entretiens" subtitle="Heures affichées selon le fuseau du Bénin." />
      {rows.length === 0 ? (
        <EmptyState title="Aucun entretien programmé" text="Ouvrez la fiche d’un candidat et cliquez sur « Appeler pour un entretien »." />
      ) : (
        <>
          <h2 className="mt-8 text-xl font-extrabold">À venir ({upcoming.length})</h2>
          {upcoming.length ? renderList(upcoming) : <p className="mt-3 text-muted">Aucun entretien à venir.</p>}
          {past.length > 0 && (<><h2 className="mt-10 text-xl font-extrabold">Passés ({past.length})</h2>{renderList(past)}</>)}
        </>
      )}
    </>
  );
}
