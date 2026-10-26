import { PageHeader } from "@/components/dashboard-ui";
import { JobForm } from "@/components/job-form";

export const metadata = { title: "Nouvelle offre – WorkMatch" };

export default function NouvelleOffrePage() {
  return (
    <>
      <PageHeader title="Nouvelle offre" subtitle="Décrivez le poste. Vous pourrez le publier tout de suite ou plus tard." />
      <JobForm />
    </>
  );
}
