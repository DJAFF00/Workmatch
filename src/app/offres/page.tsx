import { Suspense } from "react";
import { JobExplorer } from "@/components/job-explorer";
import { JobsSkeleton } from "@/components/job-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedJobs } from "@/lib/queries";

export const metadata = {
  title: "Offres d’emploi – WorkMatch",
  description: "Toutes les offres d’emploi publiées par les entreprises. Postulez en deux minutes, sans créer de compte.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function OffresPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <SiteHeader active="offres" />
      <main>
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-6">
          <h1 className="text-4xl font-extrabold sm:text-6xl">Toutes les offres</h1>
          <p className="mt-3 max-w-xl text-lg text-muted">Filtrez par poste, ville, contrat ou secteur, puis postulez directement.</p>
        </div>
        <Suspense fallback={<JobsSkeleton />}>
          <Offres searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Offres({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const pick = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const jobs = await getPublishedJobs(200);
  return <JobExplorer jobs={jobs} initial={{ q: pick("q"), ville: pick("ville"), secteur: pick("secteur") }} />;
}
