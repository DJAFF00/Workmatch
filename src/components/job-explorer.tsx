"use client";

import { useMemo, useState } from "react";
import { JobCard } from "@/components/job-card";
import { contractLabels, sectorOptions } from "@/lib/constants";
import type { PublicJob } from "@/lib/queries";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const field = "w-full bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted/60";

export function JobExplorer({ jobs, initial }: { jobs: PublicJob[]; initial: { q: string; ville: string; secteur: string } }) {
  const [q, setQ] = useState(initial.q);
  const [ville, setVille] = useState(initial.ville);
  const [contract, setContract] = useState("");
  const [sector, setSector] = useState(initial.secteur);

  const results = useMemo(() => {
    const t = norm(q.trim());
    const v = norm(ville.trim());
    return jobs.filter(
      (j) =>
        (!t || norm(`${j.title} ${j.company} ${j.sector}`).includes(t)) &&
        (!v || norm(j.location).includes(v)) &&
        (!contract || j.contract === contract) &&
        (!sector || j.sector === sector),
    );
  }, [jobs, q, ville, contract, sector]);

  const filtered = q || ville || contract || sector;
  const reset = () => { setQ(""); setVille(""); setContract(""); setSector(""); };

  return (
    <>
      <div role="search" className="glass mx-auto grid max-w-4xl gap-2 rounded-[1.75rem] p-2.5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <label className="block px-5 py-2">
          <span className="block text-xs font-semibold text-muted">Poste ou entreprise</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Comptable…" className={field} />
        </label>
        <label className="block px-5 py-2 lg:border-l lg:border-line">
          <span className="block text-xs font-semibold text-muted">Ville</span>
          <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Cotonou" className={field} />
        </label>
        <label className="block px-5 py-2 lg:border-l lg:border-line">
          <span className="block text-xs font-semibold text-muted">Contrat</span>
          <select value={contract} onChange={(e) => setContract(e.target.value)} className={field}>
            <option value="">Tous</option>
            {Object.entries(contractLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="block px-5 py-2 lg:border-l lg:border-line">
          <span className="block text-xs font-semibold text-muted">Secteur</span>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className={field}>
            <option value="">Tous</option>
            {sectorOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <section className="mx-auto max-w-6xl px-5 pt-14">
        <div className="flex items-center justify-between gap-4">
          <p className="rounded-full bg-orange-soft px-4 py-1.5 text-sm font-semibold text-orange-deep" aria-live="polite">
            {results.length} offre{results.length > 1 ? "s" : ""}
          </p>
          {filtered && <button onClick={reset} className="text-sm font-semibold text-muted hover:text-orange">Réinitialiser les filtres</button>}
        </div>
        {results.length === 0 ? (
          <p className="glass mt-8 rounded-3xl p-10 text-center text-muted">
            {jobs.length === 0 ? "Aucune offre n’est publiée pour le moment." : "Aucune offre ne correspond à votre recherche."}
          </p>
        ) : (
          <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.map((j) => <li key={j.slug}><JobCard job={j} /></li>)}
          </ul>
        )}
      </section>
    </>
  );
}
