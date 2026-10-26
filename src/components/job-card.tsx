import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { contractLabels, workModeLabels } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { PublicJob } from "@/lib/queries";

const tints = [
  ["#ff5a0f", "#ffffff"], ["#0f172a", "#ffb36b"], ["#ffe9dd", "#e24a05"],
  ["#e8f0ff", "#2b4fd8"], ["#e6f6ee", "#0d6b43"], ["#f3e8ff", "#7a35c9"],
];

export function companyTint(name: string) {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return tints[sum % tints.length];
}

export function CompanyLogo({ name, logo, size = "size-12 text-lg rounded-2xl" }: { name: string; logo?: string | null; size?: string }) {
  if (logo) {
    return (
      <span className={`grid shrink-0 place-items-center overflow-hidden bg-white ring-1 ring-line ${size}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={`Logo ${name}`} className="size-full object-contain p-1.5" />
      </span>
    );
  }
  const [bg, fg] = companyTint(name);
  return <span className={`grid shrink-0 place-items-center font-extrabold ${size}`} style={{ background: bg, color: fg }}>{name[0]?.toUpperCase()}</span>;
}

export function JobCard({ job }: { job: PublicJob }) {
  return (
    <Link href={`/offres/${job.slug}`} className="glass group flex h-full flex-col rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-16px_rgba(255,90,15,.35)]">
      <div className="flex items-center gap-3">
        <CompanyLogo name={job.company} logo={job.logo} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{job.company}</p>
          <p className="truncate text-xs text-muted">{job.location}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-full bg-white text-ink ring-1 ring-line transition group-hover:bg-orange group-hover:text-white group-hover:ring-orange"><Arrow /></span>
      </div>
      <h3 className="mt-6 text-xl font-extrabold">{job.title}</h3>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
        {job.featured && <span className="rounded-full bg-orange px-3 py-1 text-white">★ À la une</span>}
        {[contractLabels[job.contract], workModeLabels[job.workMode], job.sector].map((t, i) => (
          <span key={t} className={`rounded-full px-3 py-1 ${i === 0 ? "bg-orange-soft text-orange-deep" : "bg-white text-muted ring-1 ring-line"}`}>{t}</span>
        ))}
      </div>
      <p className="mt-auto pt-6 text-xs text-muted">Publiée le {formatDate(job.publishedAt)}</p>
    </Link>
  );
}

export function JobsSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto mt-10 grid max-w-6xl gap-5 px-5 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => <div key={i} className="glass h-52 animate-pulse rounded-3xl" />)}
    </div>
  );
}
