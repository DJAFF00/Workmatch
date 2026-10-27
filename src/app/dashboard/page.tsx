import Link from "next/link";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, interviews, jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { effectivePlan, plans } from "@/lib/plans";
import { interviewModeLabels, statusLabels } from "@/lib/constants";
import { formatDateTime, wallClockNow } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-ui";
import { Arrow } from "@/components/arrow";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;
export const metadata = { title: "Tableau de bord – WorkMatch" };

const DAYS = 14;
const dayLabel = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

function Card({ title, link, children }: { title: string; link?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[2rem] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {link && <Link href={link.href} className="flex items-center gap-1.5 text-sm font-semibold text-orange hover:text-orange-deep">{link.label} <Arrow className="size-3.5" /></Link>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="rounded-2xl bg-white/60 px-4 py-5 text-center text-sm text-muted">{children}</p>;

export default async function DashboardPage() {
  const { company, user } = await requireCompany();
  const mine = eq(jobs.companyId, company.id); // toutes les requêtes sont limitées à l'entreprise connectée

  const today = wallClockNow();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (DAYS - 1)));
  const startStr = start.toISOString().slice(0, 10);
  const day = sql<string>`to_char(${applications.createdAt} at time zone 'UTC' at time zone 'Africa/Porto-Novo', 'YYYY-MM-DD')`;
  const wallNow = sql`(now() at time zone 'Africa/Porto-Novo')`;

  const [[published], [total], [received], [fresh], [upcoming], toProcess, nextMeets, daily, myJobs, expiring] = await Promise.all([
    db.select({ n: count() }).from(jobs).where(and(mine, eq(jobs.status, "PUBLIEE"))),
    db.select({ n: count() }).from(jobs).where(mine),
    db.select({ n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id)).where(mine),
    db.select({ n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id)).where(and(mine, eq(applications.status, "NOUVEAU"))),
    db.select({ n: count() }).from(interviews).innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id)).where(and(mine, sql`${interviews.scheduledAt} >= ${wallNow}`)),
    db.select({ id: applications.id, name: applications.fullName, at: applications.createdAt, jobTitle: jobs.title })
      .from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(mine, eq(applications.status, "NOUVEAU"))).orderBy(desc(applications.createdAt)).limit(5),
    db.select({ id: interviews.id, appId: applications.id, name: applications.fullName, at: interviews.scheduledAt, mode: interviews.mode, jobTitle: interviews.jobTitle })
      .from(interviews).innerJoin(applications, eq(interviews.applicationId, applications.id)).innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(mine, sql`${interviews.scheduledAt} >= ${wallNow}`)).orderBy(asc(interviews.scheduledAt)).limit(4),
    db.select({ day, n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(mine, sql`${day} >= ${startStr}`)).groupBy(day).orderBy(day),
    db.select({ id: jobs.id, title: jobs.title, status: jobs.status, views: jobs.views, apps: count(applications.id) })
      .from(jobs).leftJoin(applications, eq(applications.jobId, jobs.id)).where(mine).groupBy(jobs.id).orderBy(desc(jobs.createdAt)).limit(5),
    db.select({ id: jobs.id, title: jobs.title, deadline: jobs.deadline }).from(jobs)
      .where(and(mine, eq(jobs.status, "PUBLIEE"), sql`${jobs.deadline} between now() and now() + interval '7 days'`)).orderBy(asc(jobs.deadline)),
  ]);

  const counts = new Map(daily.map((d) => [d.day, d.n]));
  const series = Array.from({ length: DAYS }, (_, i) => {
    const iso = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    return { iso, n: counts.get(iso) ?? 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.n));
  const periodApps = series.reduce((n, s) => n + s.n, 0);

  const plan = plans[effectivePlan(company.plan, company.planUntil)];
  const checklist = [
    { done: Boolean(company.logoUrl), label: "Ajouter le logo de l’entreprise", href: "/dashboard/parametres" },
    { done: Boolean(company.description), label: "Rédiger la présentation de l’entreprise", href: "/dashboard/parametres" },
    { done: total.n > 0, label: "Créer votre première offre", href: "/dashboard/offres/nouvelle" },
    { done: published.n > 0, label: "Publier une offre", href: "/dashboard/offres" },
    { done: received.n > 0, label: "Recevoir votre première candidature", href: `/entreprises/${company.slug}` },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const stats: [string, number, string, string][] = [
    ["Offres publiées", published.n, "/dashboard/offres", "Voir mes offres"],
    ["Candidatures reçues", received.n, "/dashboard/candidatures", "Toutes les candidatures"],
    ["À traiter", fresh.n, "/dashboard/candidatures?statut=NOUVEAU", "Nouvelles candidatures"],
    ["Entretiens à venir", upcoming.n, "/dashboard/entretiens", "Voir le calendrier"],
  ];

  return (
    <>
      <PageHeader
        title={`Bonjour, ${user.name.split(" ")[0]}`}
        subtitle={`Voici l’activité de ${company.name}.`}
        action={{ href: "/dashboard/offres/nouvelle", label: "Nouvelle offre" }}
      />

      {expiring.length > 0 && (
        <p role="status" className="mt-6 rounded-2xl bg-orange-soft px-5 py-4 text-sm font-semibold text-orange-deep">
          {expiring.length === 1 ? "1 offre se termine" : `${expiring.length} offres se terminent`} dans les 7 jours :{" "}
          {expiring.map((e, i) => (
            <span key={e.id}>{i > 0 && ", "}<Link href={`/dashboard/offres/${e.id}`} className="underline">{e.title}</Link></span>
          ))}.
        </p>
      )}

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, n, href, hint], i) => (
          <Link key={label} href={href} className={`glass group rounded-3xl p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-16px_rgba(255,90,15,.3)] ${i === 2 && n > 0 ? "ring-2 ring-orange" : ""}`}>
            <dd className="text-4xl font-extrabold">{n}</dd>
            <dt className="mt-1 text-sm font-semibold">{label}</dt>
            <p className="mt-2 text-xs text-muted group-hover:text-orange">{hint}</p>
          </Link>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card title="Candidatures à traiter" link={{ href: "/dashboard/candidatures?statut=NOUVEAU", label: "Tout voir" }}>
            {toProcess.length === 0 ? (
              <Empty>{received.n === 0 ? "Aucune candidature pour l’instant. Elles apparaîtront ici dès qu’un candidat postule." : "Tout est à jour : aucune nouvelle candidature à traiter."}</Empty>
            ) : (
              <ul className="space-y-2">
                {toProcess.map((a) => (
                  <li key={a.id}>
                    <Link href={`/dashboard/candidatures/${a.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-line transition hover:ring-orange">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{a.name}</p>
                        <p className="truncate text-xs text-muted">{a.jobTitle}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">{formatDateTime(a.at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Candidatures des ${DAYS} derniers jours`} link={{ href: "/dashboard/statistiques", label: "Statistiques" }}>
            <div role="img" aria-label={`${periodApps} candidatures sur ${DAYS} jours`} className="flex h-36 items-end gap-1">
              {series.map((s) => (
                <div key={s.iso} title={`${dayLabel(s.iso)} : ${s.n}`} className="flex h-full flex-1 items-end">
                  <div className={`w-full rounded-t-md ${s.n ? "bg-orange" : "bg-line"}`} style={{ height: s.n ? `${Math.max(8, (s.n / max) * 100)}%` : "3px" }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>{dayLabel(series[0].iso)}</span>
              <span className="font-semibold text-ink">{periodApps} au total</span>
              <span>{dayLabel(series[series.length - 1].iso)}</span>
            </div>
          </Card>

          <Card title="Vos offres" link={{ href: "/dashboard/offres", label: "Gérer" }}>
            {myJobs.length === 0 ? (
              <Empty>Vous n’avez pas encore d’offre. <Link href="/dashboard/offres/nouvelle" className="font-semibold text-orange">Créer la première</Link></Empty>
            ) : (
              <ul className="divide-y divide-line">
                {myJobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/dashboard/offres/${j.id}`} className="block truncate font-bold hover:text-orange">{j.title}</Link>
                      <p className="text-xs text-muted">{statusLabels[j.status]} · {j.views} vue{j.views > 1 ? "s" : ""}</p>
                    </div>
                    <Link href={`/dashboard/candidatures?offre=${j.id}`} className="shrink-0 rounded-full bg-orange-soft px-3 py-1 text-xs font-bold text-orange-deep hover:bg-orange hover:text-white">
                      {j.apps} candidature{j.apps > 1 ? "s" : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {doneCount < checklist.length && (
            <Card title="Bien démarrer">
              <p className="text-sm text-muted">{doneCount} étape{doneCount > 1 ? "s" : ""} sur {checklist.length}</p>
              <div className="mt-2 h-2 rounded-full bg-line"><div className="h-full rounded-full bg-orange" style={{ width: `${(doneCount / checklist.length) * 100}%` }} /></div>
              <ul className="mt-4 space-y-2">
                {checklist.map((c) => (
                  <li key={c.label}>
                    {c.done ? (
                      <p className="flex items-center gap-3 text-sm text-muted line-through"><span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-[11px] text-emerald-700" aria-hidden>✓</span>{c.label}</p>
                    ) : (
                      <Link href={c.href} className="flex items-center gap-3 text-sm font-semibold hover:text-orange"><span className="size-5 rounded-full ring-2 ring-line" aria-hidden />{c.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Prochains entretiens" link={{ href: "/dashboard/entretiens", label: "Calendrier" }}>
            {nextMeets.length === 0 ? (
              <Empty>Aucun entretien programmé. Ouvrez la fiche d’un candidat pour en proposer un.</Empty>
            ) : (
              <ul className="space-y-2">
                {nextMeets.map((m) => (
                  <li key={m.id}>
                    <Link href={`/dashboard/candidatures/${m.appId}`} className="block rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-line transition hover:ring-orange">
                      <p className="font-bold">{formatDateTime(m.at)}</p>
                      <p className="truncate text-xs text-muted">{m.name} · {m.jobTitle} · {interviewModeLabels[m.mode]}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Votre plan" link={{ href: "/dashboard/abonnement", label: "Abonnement" }}>
            <p className="text-2xl font-extrabold">{plan.name}</p>
            {plan.maxActiveJobs != null ? (
              <>
                <p className="mt-1 text-sm text-muted">{published.n} sur {plan.maxActiveJobs} offres publiées</p>
                <div className="mt-2 h-2 rounded-full bg-line"><div className="h-full rounded-full bg-orange" style={{ width: `${Math.min(100, (published.n / plan.maxActiveJobs) * 100)}%` }} /></div>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">Offres publiées illimitées.</p>
            )}
          </Card>

          <Card title="Raccourcis">
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              {[["/dashboard/offres/nouvelle", "Créer une offre"], [`/entreprises/${company.slug}`, "Ma page publique"], ["/offres", "Voir le site"], ["/dashboard/parametres", "Paramètres"]].map(([href, label]) => (
                <Link key={href} href={href} className="rounded-full bg-white px-4 py-2 ring-1 ring-line transition hover:text-orange hover:ring-orange">{label}</Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
