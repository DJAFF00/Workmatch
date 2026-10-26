import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { contractLabels, statusLabels, workModeLabels } from "@/lib/constants";
import { duplicateJob, deleteJob, setJobStatus } from "@/lib/job-actions";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;

export const metadata = { title: "Offres – WorkMatch" };

const pill: Record<string, string> = {
  PUBLIEE: "bg-emerald-50 text-emerald-700",
  BROUILLON: "bg-white text-muted ring-1 ring-line",
  CLOTUREE: "bg-orange-soft text-orange-deep",
};
const btn = "rounded-full px-3.5 py-2 text-xs font-semibold transition hover:bg-white hover:text-ink text-muted";

function StatusButton({ id, to, children }: { id: string; to: string; children: React.ReactNode }) {
  return (
    <form action={setJobStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={to} />
      <button className={btn}>{children}</button>
    </form>
  );
}

export default async function OffresPage() {
  const { company } = await requireCompany();
  const rows = await db
    .select({ job: jobs, apps: count(applications.id) })
    .from(jobs)
    .leftJoin(applications, eq(applications.jobId, jobs.id))
    .where(eq(jobs.companyId, company.id))
    .groupBy(jobs.id)
    .orderBy(desc(jobs.createdAt));

  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

  return (
    <>
      <PageHeader title="Vos offres" subtitle="Créez, publiez et suivez vos offres d’emploi." action={{ href: "/dashboard/offres/nouvelle", label: "Nouvelle offre" }} />

      {rows.length === 0 ? (
        <EmptyState title="Aucune offre pour l’instant" text="Cliquez sur « Nouvelle offre » pour publier votre premier poste." />
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map(({ job, apps }) => (
            <li key={job.id} className="glass rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/offres/${job.id}`} className="text-lg font-extrabold hover:text-orange">{job.title}</Link>
                  <p className="mt-1 text-sm text-muted">
                    {contractLabels[job.contract]} · {workModeLabels[job.workMode]} · {job.location}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${pill[job.status]}`}>{statusLabels[job.status]}</span>
              </div>

              <p className="mt-3 text-sm text-muted">
                <strong className="text-ink">{apps}</strong> candidature{apps > 1 ? "s" : ""} · {job.views} vue{job.views > 1 ? "s" : ""} · créée le {fmt.format(job.createdAt)}
                {job.deadline && <> · limite le {fmt.format(job.deadline)}</>}
              </p>

              <div className="-ml-3.5 mt-3 flex flex-wrap items-center gap-0.5">
                {job.status === "BROUILLON" && <StatusButton id={job.id} to="PUBLIEE">Publier</StatusButton>}
                {job.status === "PUBLIEE" && <StatusButton id={job.id} to="CLOTUREE">Clôturer</StatusButton>}
                {job.status === "PUBLIEE" && <StatusButton id={job.id} to="BROUILLON">Retirer</StatusButton>}
                {job.status === "CLOTUREE" && <StatusButton id={job.id} to="PUBLIEE">Republier</StatusButton>}
                <Link href={`/dashboard/offres/${job.id}`} className={btn}>Modifier</Link>
                <form action={duplicateJob}>
                  <input type="hidden" name="id" value={job.id} />
                  <button className={btn}>Dupliquer</button>
                </form>
                <form action={deleteJob}>
                  <input type="hidden" name="id" value={job.id} />
                  <ConfirmButton message="Supprimer cette offre et toutes ses candidatures ? Cette action est définitive." className={`${btn} hover:!text-orange`}>
                    Supprimer
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
