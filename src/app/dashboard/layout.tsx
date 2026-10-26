import { Suspense } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Logo } from "@/components/logo";
import { logout } from "@/lib/actions";
import { requireCompany } from "@/lib/session";

// Espace privé : le contenu dépend de la session, il est donc rendu à la demande.
export const instant = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Chargement de votre espace…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const { user, company } = await requireCompany();
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-4 lg:flex-row lg:p-6">
      <aside className="glass flex flex-col gap-5 rounded-3xl p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-64 lg:shrink-0">
        <Logo />
        <DashboardNav />
        <div className="mt-auto flex items-center gap-3 border-t border-line pt-4 max-lg:hidden">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-soft font-extrabold text-orange-deep">{company.name[0]}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{company.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>
        <form action={logout}>
          <button className="w-full rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-muted hover:bg-white hover:text-ink">Se déconnecter</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 pb-10">{children}</main>
    </div>
  );
}
