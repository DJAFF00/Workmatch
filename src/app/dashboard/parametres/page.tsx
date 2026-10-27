import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { logoSrc } from "@/lib/logo";
import { PageHeader } from "@/components/dashboard-ui";
import { DeleteAccount } from "@/components/delete-account";
import { AccountForms, CompanyForm, LogoForm } from "@/components/settings-forms";

// Page privée qui lit la base : elle peut attendre ses données (pas de pré-rendu instantané).
export const instant = false;
export const metadata = { title: "Paramètres – WorkMatch" };

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[2rem] p-6 sm:p-8">
      <h2 className="text-xl font-extrabold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function ParametresPage() {
  const { company, user } = await requireCompany();
  const [[offers], [apps]] = await Promise.all([
    db.select({ n: count() }).from(jobs).where(eq(jobs.companyId, company.id)),
    db.select({ n: count() }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id)).where(eq(jobs.companyId, company.id)),
  ]);
  return (
    <>
      <PageHeader title="Paramètres" subtitle="Le profil de votre entreprise et votre compte." />
      <p className="mt-3 text-sm">
        Page publique de votre entreprise : <Link href={`/entreprises/${company.slug}`} className="font-semibold text-orange">/entreprises/{company.slug}</Link>
      </p>
      <div className="mt-8 max-w-3xl space-y-6">
        <Card title="Logo" hint="Il apparaît sur vos offres et sur la page de votre entreprise.">
          <LogoForm name={company.name} logo={logoSrc(company.slug, company.logoUrl)} />
        </Card>
        <Card title="Profil de l’entreprise" hint="Ces informations sont visibles par les candidats.">
          <CompanyForm values={{
            name: company.name, sector: company.sector, size: company.size ?? "", city: company.city ?? "",
            country: company.country ?? "", website: company.website ?? "", description: company.description ?? "",
          }} />
        </Card>
        <Card title="Mon compte">
          <AccountForms name={user.name} email={user.email} />
        </Card>
        <section className="rounded-[2rem] bg-red-50/70 p-6 ring-1 ring-red-200 sm:p-8">
          <h2 className="text-xl font-extrabold text-red-700">Zone dangereuse</h2>
          <p className="mt-1 text-sm text-red-900/70">Supprimer votre compte efface définitivement l’entreprise, ses offres, ses candidatures et tous les fichiers associés.</p>
          <div className="mt-5"><DeleteAccount companyName={company.name} offers={offers.n} applications={apps.n} /></div>
        </section>
      </div>
    </>
  );
}
