import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { Logo } from "@/components/logo";

export function SiteHeader({ active }: { active?: "accueil" | "offres" }) {
  const link = (on: boolean) => (on ? "border-b-2 border-orange pb-1 text-orange" : "pb-1 hover:text-ink");
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
      <Logo />
      <nav className="hidden gap-9 text-sm font-semibold text-muted md:flex">
        <Link href="/" className={link(active === "accueil")}>Accueil</Link>
        <Link href="/offres" className={link(active === "offres")}>Offres</Link>
        <Link href="/#fonctionnement" className={link(false)}>Comment ça marche</Link>
        <Link href="/#entreprises" className={link(false)}>Entreprises</Link>
        <Link href="/#tarifs" className={link(false)}>Tarifs</Link>
      </nav>
      <div className="flex items-center gap-3 text-sm font-semibold">
        <Link href="/connexion" className="hidden px-2 py-2 sm:block">Connexion</Link>
        <Link href="/inscription-entreprise" className="flex items-center gap-2 rounded-full bg-orange px-5 py-3 text-white shadow-[0_10px_24px_-8px_rgba(255,90,15,.6)] hover:bg-orange-deep">
          Publier une offre <Arrow />
        </Link>
      </div>
    </header>
  );
}
