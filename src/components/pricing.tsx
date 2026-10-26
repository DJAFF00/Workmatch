import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { Reveal } from "@/components/reveal";
import { plans, type Feature } from "@/lib/plans";

function Features({ items, dark }: { items: Feature[]; dark?: boolean }) {
  return (
    <ul className="mt-6 flex-1 space-y-3 text-sm">
      {items.map((f) => (
        <li key={f.text} className="flex gap-3">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
          <span>
            {f.text}
            {f.soon && <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${dark ? "bg-white/15 text-white" : "bg-orange-soft text-orange-deep"}`}>Bientôt</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Pricing() {
  const free = plans.GRATUIT;
  const pro = plans.PRO;
  return (
    <section id="tarifs" className="mx-auto mt-32 max-w-5xl px-5">
      <Reveal className="text-center">
        <h2 className="text-3xl font-extrabold sm:text-5xl">Des tarifs simples</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Commencez gratuitement. Passez au plan Pro quand vous recrutez plus souvent.</p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Reveal className="h-full">
          <div className="glass flex h-full flex-col rounded-[2rem] p-8">
            <h3 className="text-xl font-extrabold">{free.name}</h3>
            <p className="mt-4 text-5xl font-extrabold">{free.price}</p>
            <p className="mt-1 text-sm text-muted">{free.period}</p>
            <Features items={free.features} />
            <Link href="/inscription-entreprise" className="mt-8 flex items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] hover:bg-orange-deep">
              Commencer gratuitement <Arrow />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={130} className="h-full">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-ink p-8 text-white ring-2 ring-orange">
            <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-orange/40 blur-3xl" />
            <div className="relative flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold">{pro.name}</h3>
                <span className="rounded-full bg-orange px-3 py-1 text-xs font-bold">Recommandé</span>
              </div>
              <p className="mt-4 text-5xl font-extrabold">{pro.price} <span className="text-lg font-semibold text-white/60">{pro.period}</span></p>
              {pro.priceNote && <p className="mt-1 text-sm text-white/60">{pro.priceNote}</p>}
              <Features items={pro.features} dark />
              <Link href="/inscription-entreprise" className="mt-8 flex items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white hover:bg-orange-deep">
                Choisir le plan Pro <Arrow />
              </Link>
              <p className="mt-3 text-center text-xs text-white/60">Paiement en ligne bientôt disponible : le plan Pro est activé sur demande.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
