// Données d'exemple : seront remplacées par la base Neon.
export type Job = {
  slug: string; title: string; company: string; sector: string;
  city: string; contract: string; mode: string; posted: string;
  bg: string; fg: string;
};

export const jobs: Job[] = [
  { slug: "comptable-senior", title: "Comptable senior", company: "Atlantic Fiducia", sector: "Finance", city: "Cotonou", contract: "CDI", mode: "Sur site", posted: "Aujourd'hui", bg: "#2b3fe0", fg: "#fff" },
  { slug: "developpeur-fullstack", title: "Développeur full-stack", company: "Kodjo Labs", sector: "Numérique", city: "Abomey-Calavi", contract: "CDI", mode: "Hybride", posted: "Hier", bg: "#12182b", fg: "#ffc02e" },
  { slug: "responsable-logistique", title: "Responsable logistique", company: "Sahel Transit", sector: "Transport", city: "Parakou", contract: "CDD", mode: "Sur site", posted: "Il y a 2 jours", bg: "#ffc02e", fg: "#12182b" },
  { slug: "assistante-rh", title: "Assistante RH", company: "Groupe Hounkpè", sector: "Services", city: "Cotonou", contract: "Stage", mode: "Sur site", posted: "Il y a 3 jours", bg: "#ddf3e8", fg: "#0d5c3a" },
  { slug: "community-manager", title: "Community manager", company: "Studio Wéwé", sector: "Communication", city: "Porto-Novo", contract: "Freelance", mode: "Télétravail", posted: "Il y a 4 jours", bg: "#e8e4ff", fg: "#3b2fb0" },
  { slug: "technicien-maintenance", title: "Technicien de maintenance", company: "Bénin Énergie", sector: "Industrie", city: "Cotonou", contract: "CDI", mode: "Sur site", posted: "Il y a 5 jours", bg: "#ffe3dc", fg: "#a3341c" },
];

export const cities = Array.from(new Set(jobs.map((j) => j.city)));
export const sectors = ["Numérique", "Finance", "Transport", "Industrie", "Communication", "Services", "Santé", "Éducation"];
