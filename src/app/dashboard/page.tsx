import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, interviews, jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;

export const metadata = { title: "Tableau de bord – WorkMatch" };

export default async function DashboardPage() {
  const { company, user } = await requireCompany();
  const mine = eq(jobs.companyId, company.id); // toutes les requêtes sont limitées à l'entreprise connectée

  const [[published], [total], [received], [fresh], [upcoming]] = await Promise.all([
    db.select({ n: count() }).from(jobs).where(and(mine, eq(jobs.status, "PUBLIEE"))),
    db.select({ n: count() }).from(jobs).where(mine),
    db.select({ n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id)).where(mine),
    db.select({ n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id)).where(and(mine, eq(applications.status, "NOUVEAU"))),
    db
      .select({ n: count() })
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(mine, sql`${interviews.scheduledAt} >= now()`)),
  ]);

  const stats = [
    ["Offres publiées", published.n],
    ["Candidatures reçues", received.n],
    ["Nouvelles candidatures", fresh.n],
    ["Entretiens à venir", upcoming.n],
  ];

  return (
    <>
      <PageHeader
        title={`Bonjour, ${user.name.split(" ")[0]}`}
        subtitle={`Voici l’activité de ${company.name}.`}
        action={{ href: "/dashboard/offres/nouvelle", label: "Nouvelle offre" }}
      />
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, n], i) => (
          <div key={label} className={`glass rounded-3xl p-6 ${i === 2 && Number(n) > 0 ? "ring-2 ring-orange" : ""}`}>
            <dd className="text-4xl font-extrabold">{n}</dd>
            <dt className="mt-1 text-sm font-semibold text-muted">{label}</dt>
          </div>
        ))}
      </dl>
      {total.n === 0 && (
        <EmptyState title="Publiez votre première offre" text="Décrivez le poste, les missions et les exigences. Votre offre sera visible par les candidats dès sa publication." />
      )}
    </>
  );
}
