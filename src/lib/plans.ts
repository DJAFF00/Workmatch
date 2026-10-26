// Définition des plans. Modifiez ce fichier pour changer les limites, les textes ou le prix.
export type PlanId = "GRATUIT" | "PRO";

export const plans = {
  GRATUIT: {
    id: "GRATUIT" as PlanId,
    name: "Gratuit",
    price: "0 FCFA" as string | null,
    maxActiveJobs: 2 as number | null, // offres publiées en même temps
    features: [
      "2 offres publiées en même temps",
      "Candidatures illimitées",
      "Gestion des candidats et des entretiens",
      "Statistiques par offre",
      "Page publique de l’entreprise",
    ],
  },
  PRO: {
    id: "PRO" as PlanId,
    name: "Pro",
    price: null as string | null, // ex. "15 000 FCFA / mois" quand le tarif sera décidé
    maxActiveJobs: null as number | null, // null = illimité
    features: ["Offres publiées illimitées", "Tout ce qui est inclus dans le plan Gratuit"],
  },
};

// Un plan Pro expiré redevient automatiquement Gratuit.
export function effectivePlan(plan: string, until: Date | null): PlanId {
  return plan === "PRO" && (!until || until > new Date()) ? "PRO" : "GRATUIT";
}
