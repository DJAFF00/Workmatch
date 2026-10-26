import { requireCompany } from "@/lib/session";
import { activeJobCount } from "@/lib/plan-limits";
import { effectivePlan, plans } from "@/lib/plans";
import { PageHeader } from "@/components/dashboard-ui";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;
export const metadata = { title: "Abonnement – WorkMatch" };

export default async function AbonnementPage() {
  const { company } = await requireCompany();
  const current = effectivePlan(company.plan, company.planUntil);
  const used = await activeJobCount(company.id);
  const plan = plans[current];
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const until = company.planUntil && current === "PRO"
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(company.planUntil) : null;

  return (
    <>
      <PageHeader title="Abonnement" subtitle="Votre plan et ce qu’il vous permet de publier." />

      <section className="glass mt-8 max-w-3xl rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">Plan actuel</p>
        <p className="mt-1 text-3xl font-extrabold">{plan.name}</p>
        {until && <p className="mt-1 text-sm text-muted">Actif jusqu’au {until}.</p>}
        <div className="mt-6">
          <div className="flex justify-between text-sm font-semibold">
            <span>Offres publiées</span>
            <span>{used}{plan.maxActiveJobs != null && ` / ${plan.maxActiveJobs}`}{plan.maxActiveJobs == null && " (illimité)"}</span>
          </div>
          {plan.maxActiveJobs != null && (
            <div className="mt-2 h-2.5 rounded-full bg-line">
              <div className="h-full rounded-full bg-orange" style={{ width: `${Math.min(100, (used / plan.maxActiveJobs) * 100)}%` }} />
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 grid max-w-3xl gap-6 md:grid-cols-2">
        {Object.values(plans).map((p) => (
          <section key={p.id} className={`glass rounded-[2rem] p-6 ${p.id === current ? "ring-2 ring-orange" : ""}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{p.name}</h2>
              {p.id === current && <span className="rounded-full bg-orange px-3 py-1 text-xs font-bold text-white">Votre plan</span>}
            </div>
            <p className="mt-2 text-2xl font-extrabold">{p.price} <span className="text-sm font-semibold text-muted">{p.period}</span></p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {p.features.map((f) => (
                <li key={f.text} className="flex gap-3"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
                  <span>{f.text}{f.soon && <span className="ml-2 rounded-full bg-orange-soft px-2 py-0.5 text-[10px] font-bold text-orange-deep">Bientôt</span>}</span></li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {current === "GRATUIT" && (
        <section className="glass mt-6 max-w-3xl rounded-[2rem] p-6 sm:p-8">
          <h2 className="text-lg font-extrabold">Passer au plan Pro</h2>
          <p className="mt-2 text-muted">Le paiement en ligne n’est pas encore disponible. Pour activer le plan Pro, contactez-nous : nous l’activons pour votre entreprise.</p>
          {contact && (
            <a href={`mailto:${contact}?subject=${encodeURIComponent(`Plan Pro – ${company.name}`)}`} className="mt-5 inline-block rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white hover:bg-orange-deep">
              Nous écrire
            </a>
          )}
        </section>
      )}
    </>
  );
}
