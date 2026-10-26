import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CompanyLogo, JobCard, JobsSkeleton } from "@/components/job-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { toParagraphs } from "@/lib/format";
import { getCompany } from "@/lib/queries";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) return { title: "Entreprise introuvable – WorkMatch" };
  return { title: `${company.name} – Offres d’emploi`, description: `Découvrez les offres d’emploi de ${company.name} (${company.sector}).` };
}

export default function EntreprisePage({ params }: { params: Params }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-4">
        <Link href="/offres" className="text-sm font-semibold text-muted hover:text-orange">← Toutes les offres</Link>
        <Suspense fallback={<JobsSkeleton />}>
          <Entreprise params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Entreprise({ params }: { params: Params }) {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) notFound();

  const safeSite = c.website && /^https?:\/\//i.test(c.website) ? c.website : null;
  const meta = [c.sector, c.city, c.size].filter(Boolean);

  return (
    <>
      <section className="glass mt-6 rounded-[2rem] p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-5">
          <CompanyLogo name={c.name} size="size-20 text-3xl rounded-3xl" />
          <div>
            <h1 className="text-3xl font-extrabold sm:text-5xl">{c.name}</h1>
            <p className="mt-1 text-muted">{meta.join(" · ")}</p>
          </div>
        </div>
        {c.description && (
          <div className="mt-6 max-w-3xl space-y-3 text-muted">
            {toParagraphs(c.description).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
          </div>
        )}
        {safeSite && <a href={safeSite} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-semibold text-orange">Visiter le site web</a>}
      </section>

      <h2 className="mt-14 text-2xl font-extrabold sm:text-3xl">Offres en cours ({c.jobs.length})</h2>
      {c.jobs.length === 0 ? (
        <p className="glass mt-6 rounded-3xl p-10 text-center text-muted">Cette entreprise n’a pas d’offre ouverte pour le moment.</p>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.jobs.map((j) => <li key={j.slug}><JobCard job={j} /></li>)}
        </ul>
      )}
    </>
  );
}
