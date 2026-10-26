"use server";

import { headers } from "next/headers";
import { refresh, updateTag } from "next/cache";
import { APIError } from "better-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { sectorOptions, sizeOptions } from "@/lib/constants";
import { MAX_LOGO_BYTES, checkImage, removeFiles, storageConfigured, uploadLogo } from "@/lib/storage";
import { requireCompany } from "@/lib/session";
import type { ActionResult } from "@/lib/form-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const companySchema = z.object({
  name: z.string().min(2, "Indiquez le nom de l’entreprise.").max(120, "Nom trop long."),
  sector: z.enum(sectorOptions, { error: "Choisissez un secteur d’activité." }),
  size: z.string().refine((v) => v === "" || (sizeOptions as string[]).includes(v), "Taille invalide."),
  city: z.string().max(80, "Ville trop longue."),
  country: z.string().max(80, "Pays trop long."),
  website: z.string().max(200, "Adresse du site trop longue."),
  description: z.string().max(1000, "La présentation est trop longue (1000 caractères max)."),
});

function normalizeWebsite(v: string) {
  if (!v) return { value: null as string | null };
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".")) throw new Error();
    return { value: u.toString() };
  } catch {
    return { error: "Adresse du site web invalide." };
  }
}

export async function updateCompany(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { company } = await requireCompany();
  const parsed = companySchema.safeParse({
    name: str(fd, "name"), sector: str(fd, "sector"), size: str(fd, "size"), city: str(fd, "city"),
    country: str(fd, "country"), website: str(fd, "website"), description: str(fd, "description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const site = normalizeWebsite(d.website);
  if (site.error) return { error: site.error };

  await db.update(companies).set({
    name: d.name, sector: d.sector, size: d.size || null, city: d.city || null,
    country: d.country || null, website: site.value, description: d.description || null,
  }).where(eq(companies.id, company.id)); // l'adresse publique (slug) ne change jamais

  updateTag("jobs"); // les pages publiques affichent ces informations
  refresh();
  return { success: true };
}

export async function saveLogo(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { company } = await requireCompany();
  const file = fd.get("logo");
  if (!file || typeof file === "string" || file.size === 0) return { error: "Choisissez une image." };
  if (file.size > MAX_LOGO_BYTES) return { error: "Le logo dépasse 1 Mo. Réduisez sa taille." };
  const img = await checkImage(file);
  if (!img) return { error: "Format non accepté. Utilisez une image PNG, JPG ou WebP." };
  if (!storageConfigured()) return { error: "L’envoi de fichiers n’est pas configuré (BLOB_READ_WRITE_TOKEN manquant)." };

  let pathname: string;
  try {
    pathname = await uploadLogo(img, company.id);
  } catch (e) {
    console.error("[logo] échec d’envoi", e);
    return { error: "L’envoi du logo a échoué. Réessayez dans un instant." };
  }
  await db.update(companies).set({ logoUrl: pathname }).where(eq(companies.id, company.id));
  if (company.logoUrl) await removeFiles([company.logoUrl]);

  updateTag("jobs");
  refresh();
  return { success: true };
}

export async function removeLogo() {
  const { company } = await requireCompany();
  if (!company.logoUrl) return;
  await db.update(companies).set({ logoUrl: null }).where(eq(companies.id, company.id));
  await removeFiles([company.logoUrl]);
  updateTag("jobs");
  refresh();
}

export async function updateAccountName(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireCompany();
  const name = z.string().min(2, "Indiquez votre nom.").max(120, "Nom trop long.").safeParse(str(fd, "name"));
  if (!name.success) return { error: name.error.issues[0].message };
  try {
    await auth.api.updateUser({ headers: await headers(), body: { name: name.data } });
  } catch (e) {
    if (e instanceof APIError) return { error: "Impossible de modifier le nom." };
    throw e;
  }
  refresh();
  return { success: true };
}

export async function changePassword(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireCompany();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!current) return { error: "Saisissez votre mot de passe actuel." };
  if (next.length < 8) return { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." };
  if (next !== String(fd.get("confirm") ?? "")) return { error: "La confirmation ne correspond pas au nouveau mot de passe." };
  try {
    await auth.api.changePassword({ headers: await headers(), body: { currentPassword: current, newPassword: next, revokeOtherSessions: true } });
  } catch (e) {
    if (e instanceof APIError) return { error: "Mot de passe actuel incorrect." };
    throw e;
  }
  return { success: true };
}
