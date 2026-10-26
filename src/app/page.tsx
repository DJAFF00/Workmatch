import Link from "next/link";
import { Arrow } from "@/components/arrow";
import Image from "next/image";
import { Suspense } from "react";
import { JobsSkeleton } from "@/components/job-card";
import { LatestJobs } from "@/components/latest-jobs";
import { Pricing } from "@/components/pricing";
import { Reveal } from "@/components/reveal";
import { SearchForm } from "@/components/search-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { sectorOptions } from "@/lib/constants";

const candidateSteps = [
  ["Trouvez une offre", "Cherchez par poste, entreprise ou ville."],
  ["Postulez en deux minutes", "CV, diplômes et quelques infos. Aucun compte à créer."],
  ["Recevez la réponse par email", "Si votre profil est retenu, l’entreprise vous écrit avec la date de l’entretien."],
];
const companySteps = [
  ["Créez le compte de votre entreprise", "Nom, secteur d’activité, logo. Vous arrivez directement dans votre espace."],
  ["Publiez vos offres", "Missions, exigences, contrat. Le salaire reste facultatif."],
  ["Triez les candidatures", "Chaque nouvelle candidature apparaît dans votre tableau de bord."],
  ["Convoquez à un entretien", "Choisissez la date et l’heure : le candidat reçoit l’invitation par email."],
];
const stats = [["2 min", "pour postuler"], ["0", "compte à créer"], ["1", "tableau de bord"], ["100%", "gratuit candidats"]];
const faq = [
  ["Dois-je créer un compte pour postuler ?", "Non. Vous remplissez le formulaire de l’offre, joignez vos documents et envoyez. Les réponses arrivent sur votre adresse email."],
  ["Publier une offre est-il payant ?", "Un plan gratuit permet de publier 2 offres en même temps, avec des candidatures illimitées. Le plan Pro, pour publier sans limite, sera bientôt disponible."],
  ["Mes documents sont-ils protégés ?", "Seule l’entreprise à laquelle vous postulez peut consulter votre candidature. Vous pouvez demander sa suppression à tout moment."],
  ["Comment l’entreprise me contacte-t-elle ?", "Par email, depuis son espace WorkMatch. Pour un entretien, vous recevez la date, l’heure et l’intitulé du poste."],
];

function Steps({ items }: { items: string[][] }) {
  return (
    <ol className="mt-8 space-y-6">
      {items.map(([t, d], i) => (
        <li key={t} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange text-sm font-extrabold text-white shadow-[0_8px_18px_-6px_rgba(255,90,15,.6)]">{i + 1}</span>
          <div>
            <p className="font-bold">{t}</p>
            <p className="text-sm text-muted">{d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  return (
    <>
      <noscript><style>{".reveal{opacity:1!important;transform:none!important}"}</style></noscript>
      <SiteHeader active="accueil" />

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-6 px-5 pb-16 pt-8 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold ring-1 ring-line">
              <span className="size-2 rounded-full bg-orange" /> Plateforme de recrutement
            </p>
            <h1 className="rise rise-2 mt-6 text-5xl font-extrabold leading-[1.02] sm:text-6xl xl:text-7xl">
              Le bon poste,
              <span className="block text-orange">sans compte à créer.</span>
            </h1>
            <p className="rise rise-3 mt-6 max-w-md text-lg text-muted">
              Parcourez les offres des entreprises et postulez en deux minutes. Les recruteurs publient, trient et convoquent depuis un seul tableau de bord.
            </p>
            <div className="rise rise-3 mt-9 flex flex-wrap items-center gap-4">
              <a href="#offres" className="flex items-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] hover:bg-orange-deep">
                Voir les offres <Arrow />
              </a>
              <Link href="/inscription-entreprise" className="flex items-center gap-3 font-semibold">
                <span className="grid size-12 place-items-center rounded-full bg-white ring-1 ring-line"><Arrow /></span>
                Je recrute
              </Link>
            </div>
            <dl className="rise rise-4 mt-12 grid max-w-md grid-cols-4 divide-x divide-line">
              {stats.map(([n, l]) => (
                <div key={l} className="px-3 first:pl-0">
                  <dt className="text-2xl font-extrabold">{n}</dt>
                  <dd className="text-xs text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rise rise-3 relative mx-auto w-full max-w-[640px] lg:max-w-none">
            <div aria-hidden className="absolute inset-[8%] -z-10 rounded-full bg-orange/25 blur-3xl" />
            <div className="float-y">
            <Image
              src="/hero.webp"
              alt="Tableau de bord de recrutement : liste de candidats, fiche profil, statistiques et calendrier d’entretiens"
              width={1441}
              height={917}
              priority
              sizes="(min-width: 1024px) 640px, 100vw"
              className="h-auto w-full drop-shadow-[0_30px_40px_rgba(15,23,42,.16)]"
            />
            </div>
          </div>
        </section>

        <SearchForm />
        <Suspense fallback={<JobsSkeleton />}>
          <LatestJobs />
        </Suspense>

        <section id="fonctionnement" className="mx-auto mt-32 grid max-w-6xl gap-8 px-5 md:grid-cols-2">
          <Reveal className="h-full">
          <div className="glass h-full rounded-[2rem] p-8 sm:p-10">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Vous cherchez un emploi</h2>
            <Steps items={candidateSteps} />
          </div>
          </Reveal>
          <Reveal delay={130} className="h-full">
          <div className="glass h-full rounded-[2rem] p-8 sm:p-10">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Vous recrutez</h2>
            <Steps items={companySteps} />
          </div>
          </Reveal>
        </section>

        <Reveal><section className="mx-auto mt-24 max-w-6xl px-5">
          <h2 className="text-2xl font-extrabold">Parcourir par secteur</h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {sectorOptions.map((s) => (
              <li key={s}>
                <Link href={`/offres?secteur=${encodeURIComponent(s)}`} className="glass block rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-orange hover:text-white">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </section></Reveal>

        <Reveal><section id="entreprises" className="mx-auto mt-32 max-w-6xl px-5">
          <div className="relative overflow-hidden rounded-[2.25rem] bg-ink p-8 text-white sm:p-14">
            <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-orange/40 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <h2 className="text-4xl font-extrabold sm:text-5xl">Recrutez sans tableur ni boîte mail saturée.</h2>
                <p className="mt-5 max-w-md text-white/70">
                  Chaque candidature arrive classée par offre. Vous retenez les meilleurs profils, les contactez et fixez l’entretien en quelques clics.
                </p>
                <Link href="/inscription-entreprise" className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white hover:bg-orange-deep">
                  Créer le compte de mon entreprise <Arrow />
                </Link>
              </div>
              <div aria-hidden className="grid grid-cols-3 gap-2.5 rounded-3xl bg-white/10 p-3 text-xs backdrop-blur">
                {[
                  ["Nouveaux", ["Awa K.", "Jean D.", "Fatou S."]],
                  ["Retenus", ["Marc A.", "Nadège T."]],
                  ["Entretien", ["Ibrahim L."]],
                ].map(([col, names]) => (
                  <div key={col as string} className="rounded-2xl bg-white/5 p-2">
                    <p className="mb-2 px-1 font-bold text-white/60">{col as string}</p>
                    {(names as string[]).map((n, i) => (
                      <p key={n} className={`mb-1.5 rounded-xl px-2.5 py-2.5 font-semibold ${col === "Entretien" ? "bg-orange" : i === 0 && col === "Retenus" ? "bg-white text-ink" : "bg-white/10"}`}>{n}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section></Reveal>

        <Pricing />

        <Reveal><section className="mx-auto mt-32 max-w-3xl px-5">
          <h2 className="text-3xl font-extrabold sm:text-5xl">Questions fréquentes</h2>
          <div className="mt-10 space-y-3">
            {faq.map(([q, a]) => (
              <details key={q} className="glass group rounded-2xl px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                  {q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-soft text-xl text-orange transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 max-w-prose text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section></Reveal>
      </main>

      <SiteFooter />
    </>
  );
}
