import { EmptyState, PageHeader } from "@/components/dashboard-ui";

export const metadata = { title: "Paramètres – WorkMatch" };

export default function Page() {
  return (
    <>
      <PageHeader title="Paramètres" subtitle="Informations de votre entreprise et de votre compte." />
      <EmptyState title="Bientôt disponible" text="Cette section sera activée aux prochaines étapes." />
    </>
  );
}
