import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyMembers } from "@/db/schema";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

// Renvoie l'utilisateur connecté et SON entreprise. Toutes les requêtes du dashboard passent par là.
export const requireCompany = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const [row] = await db
    .select({ company: companies, role: companyMembers.role })
    .from(companyMembers)
    .innerJoin(companies, eq(companyMembers.companyId, companies.id))
    .where(eq(companyMembers.userId, session.user.id))
    .limit(1);
  if (!row) redirect("/inscription-entreprise");

  return { user: session.user, company: row.company, role: row.role };
});
