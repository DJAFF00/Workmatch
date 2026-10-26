import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { JobCard } from "@/components/job-card";
import { Reveal } from "@/components/reveal";
import { getPublishedJobs } from "@/lib/queries";

export async function LatestJobs() {
  const jobs = await getPublishedJobs(6);
  return (
    <section id="offres" className="mx-auto max-w-6xl px-5 pt-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-extrabold sm:text-5xl">Offres du moment</h2>
        {jobs.length > 0 && (
          <Link href="/offres" className="flex items-center gap-2 text-sm font-semibold hover:text-orange">Voir toutes les offres <Arrow /></Link>
        )}
      </Reveal>
      {jobs.length === 0 ? (
        <div className="glass mt-10 rounded-[2rem] p-10 text-center">
          <p className="text-xl font-extrabold">Les premières offres arrivent bientôt.</p>
          <p className="mx-auto mt-2 max-w-md text-muted">Vous recrutez ? Créez le compte de votre entreprise et publiez la première offre.</p>
          <Link href="/inscription-entreprise" className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 font-semibold text-white hover:bg-orange-deep">Publier une offre <Arrow /></Link>
        </div>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j, i) => <li key={j.slug}><Reveal delay={(i % 3) * 90} className="h-full"><JobCard job={j} /></Reveal></li>)}
        </ul>
      )}
    </section>
  );
}
