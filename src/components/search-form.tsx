import { Arrow } from "@/components/arrow";

// Formulaire de recherche de la landing : envoie vers /offres avec les filtres dans l'URL.
export function SearchForm() {
  return (
    <form action="/offres" role="search" className="glass rise rise-4 mx-auto grid max-w-4xl gap-2 rounded-[1.75rem] p-2.5 sm:grid-cols-[1fr_220px_auto]">
      <label className="block px-5 py-2">
        <span className="block text-xs font-semibold text-muted">Poste, entreprise ou secteur</span>
        <input name="q" placeholder="Comptable, développeur, logistique…" className="w-full bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted/60" />
      </label>
      <label className="block border-line px-5 py-2 sm:border-l">
        <span className="block text-xs font-semibold text-muted">Ville</span>
        <input name="ville" placeholder="Cotonou" className="w-full bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted/60" />
      </label>
      <button className="flex items-center justify-center gap-2 rounded-full bg-orange px-8 py-3.5 font-semibold text-white shadow-[0_10px_24px_-8px_rgba(255,90,15,.6)] transition hover:bg-orange-deep">
        Rechercher <Arrow />
      </button>
    </form>
  );
}
