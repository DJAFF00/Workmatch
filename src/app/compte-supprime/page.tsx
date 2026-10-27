import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Compte supprimé – WorkMatch", robots: { index: false } };

export default function CompteSupprimePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 pt-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-orange text-2xl text-white" aria-hidden>✓</span>
        <h1 className="mt-6 text-4xl font-extrabold">Votre compte a été supprimé</h1>
        <p className="mt-4 text-muted">L’entreprise, ses offres, les candidatures et les fichiers associés ont été effacés définitivement. Merci d’avoir utilisé WorkMatch.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="flex items-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white hover:bg-orange-deep">Retour à l’accueil <Arrow /></Link>
          <Link href="/inscription-entreprise" className="rounded-full bg-white px-6 py-4 font-semibold ring-1 ring-line hover:ring-orange">Créer un nouveau compte</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
