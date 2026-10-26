export type FormState = { error?: string; step?: 1 | 2 } | undefined;

// Pour le formulaire d'offre : on renvoie aussi les valeurs saisies pour ne rien perdre en cas d'erreur.
export type JobFormState = { error?: string; fields?: Record<string, string> } | undefined;

export type ApplyState = { error?: string; success?: boolean; fields?: Record<string, string> } | undefined;

export type ActionResult = { error?: string; success?: boolean; warning?: string } | undefined;
