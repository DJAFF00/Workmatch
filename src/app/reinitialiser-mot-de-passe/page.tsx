import Link from "next/link";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Nouveau mot de passe – WorkMatch", robots: { index: false } };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default function ReinitialiserPage({ searchParams }: { searchParams: SP }) {
  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe d’au moins 8 caractères."
      footer={<>Retour à la <Link href="/connexion" className="font-bold text-orange">connexion</Link></>}
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/60" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function Content({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const token = first(sp.token);

  if (!token || first(sp.error)) {
    return (
      <div role="alert" className="text-center">
        <p className="text-lg font-extrabold">Ce lien n’est plus valable</p>
        <p className="mt-2 text-sm text-muted">Il a expiré ou a déjà été utilisé. Vous pouvez en demander un nouveau.</p>
        <Link href="/mot-de-passe-oublie" className="mt-5 inline-block rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white hover:bg-orange-deep">Demander un nouveau lien</Link>
      </div>
    );
  }
  return <ResetForm token={token} />;
}
