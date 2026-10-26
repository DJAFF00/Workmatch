import Image from "next/image";
import { Logo } from "@/components/logo";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[minmax(0,520px)_1fr]">
      <div className="flex flex-col">
        <Logo />
        <div className="my-auto py-10">
          <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-3 text-muted">{subtitle}</p>
          <div className="glass mt-8 rounded-[2rem] p-6 sm:p-8">{children}</div>
          <p className="mt-6 text-sm text-muted">{footer}</p>
        </div>
      </div>
      <aside className="relative hidden items-center justify-center overflow-hidden rounded-[2.25rem] bg-ink p-10 text-white lg:flex">
        <div aria-hidden className="absolute -right-20 -top-20 size-96 rounded-full bg-orange/40 blur-3xl" />
        <div className="relative">
          <Image src="/hero.webp" alt="" width={1441} height={917} sizes="600px" className="h-auto w-full" />
          <p className="mt-8 text-2xl font-extrabold">Publiez, triez, convoquez.</p>
          <p className="mt-2 max-w-md text-white/70">Toutes vos candidatures au même endroit, avec les invitations d’entretien envoyées automatiquement.</p>
        </div>
      </aside>
    </div>
  );
}
