"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth";
import { count, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { applications, companies, companyMembers, emailLogs, jobs, user } from "@/db/schema";
import { deleteFilesStrict, storageConfigured } from "@/lib/storage";
import { requireCompany } from "@/lib/session";
import type { ActionResult } from "@/lib/form-state";

// Supprime DÉFINITIVEMENT l'entreprise, ses offres, ses candidatures (et leurs fichiers) puis le compte.
export async function deleteAccount(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { user: me, company, role } = await requireCompany();
  const password = String(fd.get("password") ?? "");
  if (!password) return { error: "Saisissez votre mot de passe." };

  // Une entreprise ne peut être supprimée que par son administrateur, et seulement s'il est seul.
  const [members] = await db.select({ n: count() }).from(companyMembers).where(eq(companyMembers.companyId, company.id));
  if (role !== "ADMIN" || members.n > 1) {
    return { error: "D’autres personnes sont rattachées à cette entreprise. Retirez-les d’abord avant de supprimer le compte." };
  }

  // 1. Le mot de passe doit être correct.
  try {
    await auth.api.verifyPassword({ headers: await headers(), body: { password } });
  } catch (e) {
    if (e instanceof APIError) return { error: "Mot de passe incorrect." };
    throw e;
  }

  // 2. Fichiers (CV, diplômes, logo) : d'abord, pour ne jamais laisser de données personnelles orphelines.
  const rows = await db
    .select({ cv: applications.cvUrl, diplomas: applications.diplomaUrls })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(jobs.companyId, company.id));
  const files = [...rows.flatMap((r) => [r.cv, ...(r.diplomas ?? [])]), ...(company.logoUrl ? [company.logoUrl] : [])];
  if (files.length > 0) {
    if (!storageConfigured()) return { error: "Le stockage de fichiers n’est pas accessible. Réessayez plus tard : rien n’a été supprimé." };
    try {
      await deleteFilesStrict(files);
    } catch (e) {
      console.error("[suppression] échec de suppression des fichiers", e);
      return { error: "Les fichiers n’ont pas pu être supprimés. Votre compte est intact : réessayez dans un instant." };
    }
  }

  // 3. Base de données : historique d'emails des candidats, puis l'entreprise (offres, candidatures,
  // entretiens et notes disparaissent avec elle). Les deux ordres passent ensemble ou pas du tout.
  const applicationIds = db
    .select({ id: applications.id })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(jobs.companyId, company.id));
  await db.batch([
    db.delete(emailLogs).where(inArray(emailLogs.applicationId, applicationIds)),
    db.delete(companies).where(eq(companies.id, company.id)),
  ]);

  // 4. Déconnexion, puis suppression de l'utilisateur (ses sessions et son mot de passe partent avec lui).
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // la session sera de toute façon supprimée avec l'utilisateur
  }
  await db.delete(user).where(eq(user.id, me.id));

  redirect("/compte-supprime");
}
