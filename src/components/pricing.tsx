import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { plans } from "@/lib/plans";

export function Pricing() {
  const free = plans.GRATUIT;
  const pro = plans.PRO;
  return (
    <section id="tarifs" className="mx-auto mt-32 max-w-5xl px-5">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold sm:text-5xl">Des tarifs simples</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Commencez gratuitement. Passez au plan Pro quand vous publiez plus d’offres.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="glass flex flex-col rounded-[2rem] p-8">
          <h3 className="text-xl font-extrabold">{free.name}</h3>
          <p className="mt-4 text-5xl font-extrabold">{free.price}</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {free.features.map((f) => (
              <li key={f} className="flex gap-3"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />{f}</li>
            ))}
          </ul>
          <Link href="/inscription-entreprise" className="mt-8 flex items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] hover:bg-orange-deep">
            Commencer gratuitement <Arrow />
          </Link>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-[2rem] bg-ink p-8 text-white">
          <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-orange/40 blur-3xl" />
          <div className="relative flex flex-1 flex-col">
            <h3 className="text-xl font-extrabold">{pro.name}</h3>
            <p className="mt-4 text-5xl font-extrabold">{pro.price ?? "Bientôt"}</p>
            {!pro.price && <p className="mt-1 text-sm text-white/60">Tarif annoncé prochainement</p>}
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {pro.features.map((f) => (
                <li key={f} className="flex gap-3"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />{f}</li>
              ))}
            </ul>
            <span className="mt-8 block rounded-full bg-white/10 px-7 py-4 text-center font-semibold text-white/70">Bientôt disponible</span>
          </div>
        </div>
      </div>
    </section>
  );
}
