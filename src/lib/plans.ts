// Définition des plans. Modifiez ce fichier pour changer les limites, les textes ou le prix.
export type PlanId = "GRATUIT" | "PRO";
export type Feature = { text: string; soon?: boolean };

export const plans = {
  GRATUIT: {
    id: "GRATUIT" as PlanId,
    name: "Gratuit",
    price: "0 FCFA",
    period: "pour toujours",
    priceNote: null as string | null,
    maxActiveJobs: 2 as number | null, // offres publiées en même temps
    features: [
      { text: "2 offres publiées en même temps" },
      { text: "Candidatures illimitées" },
      { text: "Gestion des candidats et des entretiens" },
      { text: "Statistiques par offre" },
      { text: "Page publique de l’entreprise" },
    ] as Feature[],
  },
  PRO: {
    id: "PRO" as PlanId,
    name: "Pro",
    price: "15 000 FCFA",
    period: "/ mois",
    priceNote: "ou 150 000 FCFA / an (2 mois offerts)" as string | null,
    maxActiveJobs: null as number | null, // null = illimité
    features: [
      { text: "Offres publiées illimitées" },
      { text: "Offres mises en avant : badge « À la une » et affichage en tête des listes" },
      { text: "Tout ce qui est inclus dans le plan Gratuit" },
      { text: "Plusieurs recruteurs sur le même compte", soon: true },
      { text: "Export des candidatures en Excel", soon: true },
    ] as Feature[],
  },
};

// Un plan Pro expiré redevient automatiquement Gratuit.
export function effectivePlan(plan: string, until: Date | null): PlanId {
  return plan === "PRO" && (!until || until > new Date()) ? "PRO" : "GRATUIT";
}
