import Link from "next/link";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applicationStatus, applications, interviews, jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { applicationStatusLabels, statusLabels } from "@/lib/constants";
import { wallClockNow } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-ui";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;
export const metadata = { title: "Statistiques – WorkMatch" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const PERIODS = [7, 30, 90];
const dayLabel = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export default async function StatsPage({ searchParams }: { searchParams: SP }) {
  const { company } = await requireCompany();
  const sp = await searchParams;
  const raw = Number(Array.isArray(sp.periode) ? sp.periode[0] : sp.periode);
  const days = PERIODS.includes(raw) ? raw : 30;

  const today = wallClockNow(); // date du jour à l'heure du Bénin
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (days - 1)));
  const startStr = start.toISOString().slice(0, 10);

  const mine = eq(jobs.companyId, company.id);
  const day = sql<string>`to_char(${applications.createdAt} at time zone 'UTC' at time zone 'Africa/Porto-Novo', 'YYYY-MM-DD')`;

  const [perJob, daily, byStatus, [meets]] = await Promise.all([
    db.select({ id: jobs.id, title: jobs.title, status: jobs.status, views: jobs.views, apps: count(applications.id) })
      .from(jobs).leftJoin(applications, eq(applications.jobId, jobs.id)).where(mine).groupBy(jobs.id).orderBy(desc(jobs.createdAt)),
    db.select({ day, n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(mine, sql`${day} >= ${startStr}`)).groupBy(day).orderBy(day),
    db.select({ status: applications.status, n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(mine).groupBy(applications.status),
    db.select({ n: count() }).from(interviews).innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id)).where(and(mine, sql`${interviews.createdAt} >= ${start}`)),
  ]);

  // Une barre par jour, y compris les jours sans candidature.
  const counts = new Map(daily.map((d) => [d.day, d.n]));
  const series = Array.from({ length: days }, (_, i) => {
    const iso = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    return { iso, n: counts.get(iso) ?? 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.n));
  const periodApps = series.reduce((n, s) => n + s.n, 0);

  const totalViews = perJob.reduce((n, j) => n + j.views, 0);
  const totalApps = perJob.reduce((n, j) => n + j.apps, 0);
  const conversion = totalViews > 0 ? `${((totalApps / totalViews) * 100).toFixed(1).replace(".", ",")} %` : "–";
  const statusN = (s: string) => byStatus.find((b) => b.status === s)?.n ?? 0;
  const funnelMax = Math.max(1, ...applicationStatus.enumValues.map(statusN));

  const kpis = [
    ["Vues des offres", String(totalViews), "Toutes périodes, une vue par visiteur et par session"],
    [`Candidatures (${days} jours)`, String(periodApps), `${totalApps} au total`],
    ["Taux de conversion", conversion, "Candidatures ÷ vues, toutes périodes"],
    [`Entretiens (${days} jours)`, String(meets.n), "Programmés sur la période"],
  ];

  return (
    <>
      <PageHeader title="Statistiques" subtitle="Ce qui fonctionne, offre par offre." />

      <div className="mt-6 flex gap-2">
        {PERIODS.map((p) => (
          <Link key={p} href={`/dashboard/statistiques?periode=${p}`} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${days === p ? "bg-orange text-white" : "glass hover:text-orange"}`}>
            {p} jours
          </Link>
        ))}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, hint]) => (
          <div key={label} className="glass rounded-3xl p-6">
            <dd className="text-4xl font-extrabold">{value}</dd>
            <dt className="mt-1 text-sm font-semibold">{label}</dt>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </div>
        ))}
      </dl>

      <section className="glass mt-6 rounded-[2rem] p-6 sm:p-8">
        <h2 className="text-lg font-extrabold">Candidatures par jour</h2>
        <div role="img" aria-label={`Candidatures par jour sur ${days} jours : ${periodApps} au total`} className="mt-6 flex h-44 items-end gap-px sm:gap-1">
          {series.map((s) => (
            <div key={s.iso} title={`${dayLabel(s.iso)} : ${s.n}`} className="flex h-full flex-1 items-end">
              <div className={`w-full rounded-t-md ${s.n ? "bg-orange" : "bg-line"}`} style={{ height: s.n ? `${Math.max(6, (s.n / max) * 100)}%` : "3px" }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{dayLabel(series[0].iso)}</span>
          <span>Maximum : {max} par jour</span>
          <span>{dayLabel(series[series.length - 1].iso)}</span>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <section className="glass rounded-[2rem] p-6 sm:p-8">
          <h2 className="text-lg font-extrabold">Parcours des candidats</h2>
          <ul className="mt-5 space-y-4">
            {applicationStatus.enumValues.map((s) => (
              <li key={s}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{applicationStatusLabels[s]}</span><span className="text-muted">{statusN(s)}</span></div>
                <div className="mt-1.5 h-2.5 rounded-full bg-line">
                  <div className={`h-full rounded-full ${s === "REFUSE" ? "bg-muted/60" : "bg-orange"}`} style={{ width: `${(statusN(s) / funnelMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass rounded-[2rem] p-6 sm:p-8">
          <h2 className="text-lg font-extrabold">Performance par offre</h2>
          {perJob.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Publiez une offre pour voir ses statistiques.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr><th className="pb-3 font-semibold">Offre</th><th className="pb-3 text-right font-semibold">Vues</th><th className="pb-3 text-right font-semibold">Candidatures</th><th className="pb-3 text-right font-semibold">Conversion</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...perJob].sort((a, b) => b.apps - a.apps).map((j) => (
                    <tr key={j.id}>
                      <td className="py-3 pr-3">
                        <Link href={`/dashboard/candidatures?offre=${j.id}`} className="font-bold hover:text-orange">{j.title}</Link>
                        <span className="ml-2 text-xs text-muted">{statusLabels[j.status]}</span>
                      </td>
                      <td className="py-3 text-right">{j.views}</td>
                      <td className="py-3 text-right font-bold">{j.apps}</td>
                      <td className="py-3 text-right text-muted">{j.views > 0 ? `${((j.apps / j.views) * 100).toFixed(1).replace(".", ",")} %` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
