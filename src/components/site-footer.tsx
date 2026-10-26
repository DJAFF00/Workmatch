import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted">
        <p>© 2026 WorkMatch. Tous droits réservés.</p>
        <div className="flex gap-6 font-semibold">
          <Link href="/offres">Offres</Link>
          <Link href="/connexion">Espace entreprise</Link>
          <Link href="/inscription-entreprise">Publier une offre</Link>
        </div>
      </div>
    </footer>
  );
}
