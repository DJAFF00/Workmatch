import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applicationNotes, applications, interviews, jobs, user } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { applicationStatusLabels, contractLabels, interviewModeLabels } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { addNote, cancelInterview, deleteNote, setApplicationStatus, setRating } from "@/lib/candidate-actions";
import { ConfirmButton } from "@/components/confirm-button";
import { ContactDialog, InterviewDialog } from "@/components/candidate-dialogs";
import { inputClass } from "@/components/field";
import { statusPill } from "@/lib/status-style";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;
export const metadata = { title: "Candidat – WorkMatch" };

const chip = "rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-line transition hover:ring-orange hover:text-orange";
const actionLabels: Record<string, string> = {
  PRESELECTIONNE: "Présélectionner", REFUSE: "Refuser", EMBAUCHE: "Marquer comme embauché", NOUVEAU: "Remettre en « Nouveau »",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[2rem] p-6 sm:p-8">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { company } = await requireCompany();

  const [row] = await db
    .select({ app: applications, jobTitle: jobs.title, jobContract: jobs.contract })
    .from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(applications.id, id), eq(jobs.companyId, company.id))).limit(1);
  if (!row) notFound();
  const a = row.app;

  const [notes, meets] = await Promise.all([
    db.select({ id: applicationNotes.id, content: applicationNotes.content, createdAt: applicationNotes.createdAt, authorId: applicationNotes.authorId, author: user.name })
      .from(applicationNotes).leftJoin(user, eq(applicationNotes.authorId, user.id))
      .where(eq(applicationNotes.applicationId, a.id)).orderBy(desc(applicationNotes.createdAt)),
    db.select().from(interviews).where(eq(interviews.applicationId, a.id)).orderBy(asc(interviews.scheduledAt)),
  ]);
  const { user: me } = await requireCompany();
  const answers = Object.entries(a.answers ?? {});

  return (
    <>
      <Link href="/dashboard/candidatures" className="text-sm font-semibold text-muted hover:text-orange">← Toutes les candidatures</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{a.fullName}</h1>
          <p className="mt-1 text-muted">Candidature pour <strong className="text-ink">{row.jobTitle}</strong> ({contractLabels[row.jobContract]}) · reçue le {formatDateTime(a.createdAt)}</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${statusPill[a.status]}`}>{applicationStatusLabels[a.status]}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <InterviewDialog id={a.id} name={a.fullName} email={a.email} jobTitle={row.jobTitle} />
        <ContactDialog id={a.id} name={a.fullName} email={a.email} jobTitle={row.jobTitle} company={company.name} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Informations">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {[["Email", a.email], ["Téléphone", a.phone], ["Ville", a.city]].map(([k, v]) => (
                <div key={k as string}><dt className="text-muted">{k}</dt><dd className="font-semibold">{v || "Non renseigné"}</dd></div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`/dashboard/candidatures/fichier?c=${a.id}&f=cv`} target="_blank" className={chip}>Voir le CV</a>
              {(a.diplomaUrls ?? []).map((_, i) => (
                <a key={i} href={`/dashboard/candidatures/fichier?c=${a.id}&f=d${i}`} target="_blank" className={chip}>Diplôme {i + 1}</a>
              ))}
            </div>
          </Card>

          {a.coverLetter && <Card title="Lettre de motivation"><p className="whitespace-pre-line text-muted">{a.coverLetter}</p></Card>}

          {answers.length > 0 && (
            <Card title="Réponses aux questions">
              <dl className="space-y-4">
                {answers.map(([q, r]) => (
                  <div key={q}><dt className="text-sm font-semibold">{q}</dt><dd className="mt-1 whitespace-pre-line text-muted">{r}</dd></div>
                ))}
              </dl>
            </Card>
          )}

          <Card title="Notes internes">
            <form action={addNote} className="flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="id" value={a.id} />
              <textarea name="content" required rows={2} maxLength={2000} placeholder="Votre avis, points à vérifier… (invisible pour le candidat)" className={`${inputClass} flex-1`} />
              <button className="self-start rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white hover:bg-orange-deep">Ajouter</button>
            </form>
            {notes.length > 0 && (
              <ul className="mt-5 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-white/70 p-4 ring-1 ring-line">
                    <p className="whitespace-pre-line">{n.content}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted">
                      <span>{n.author ?? "Recruteur"} · {formatDateTime(n.createdAt)}</span>
                      {n.authorId === me.id && (
                        <form action={deleteNote}>
                          <input type="hidden" name="id" value={a.id} /><input type="hidden" name="noteId" value={n.id} />
                          <ConfirmButton message="Supprimer cette note ?" className="font-semibold hover:text-orange">Supprimer</ConfirmButton>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Évaluation">
            <form action={setRating} className="flex items-center gap-1">
              <input type="hidden" name="id" value={a.id} />
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} name="rating" value={n} aria-label={`${n} sur 5`} className={`text-3xl leading-none transition hover:scale-110 ${a.rating && n <= a.rating ? "text-orange" : "text-line"}`}>★</button>
              ))}
              {a.rating && <button name="rating" value={0} className="ml-3 text-xs font-semibold text-muted hover:text-orange">Effacer</button>}
            </form>
          </Card>

          <Card title="Décision">
            <div className="flex flex-wrap gap-2">
              {Object.entries(actionLabels).filter(([s]) => s !== a.status).map(([s, label]) => (
                <form key={s} action={setApplicationStatus}>
                  <input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={s} />
                  <button className={chip}>{label}</button>
                </form>
              ))}
            </div>
          </Card>

          <Card title="Entretiens">
            {meets.length === 0 ? (
              <p className="text-sm text-muted">Aucun entretien programmé.</p>
            ) : (
              <ul className="space-y-3">
                {meets.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-white/70 p-4 ring-1 ring-line">
                    <p className="font-bold">{formatDateTime(m.scheduledAt)}</p>
                    <p className="text-sm text-muted">{m.jobTitle} · {interviewModeLabels[m.mode]}{m.locationOrLink && <> · {m.locationOrLink}</>}</p>
                    <form action={cancelInterview} className="mt-2">
                      <input type="hidden" name="interviewId" value={m.id} />
                      <ConfirmButton message="Supprimer cet entretien ? Le candidat ne sera pas prévenu automatiquement." className="text-xs font-semibold text-muted hover:text-orange">Supprimer</ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
