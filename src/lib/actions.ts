"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyMembers, user } from "@/db/schema";
import { slugify } from "@/lib/utils";
import { sectorOptions } from "@/lib/constants";
import type { FormState } from "@/lib/form-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const registerSchema = z.object({
  name: z.string().min(2, "Indiquez votre nom complet."),
  email: z.email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  companyName: z.string().min(2, "Indiquez le nom de l’entreprise."),
  sector: z.enum(sectorOptions, { error: "Choisissez un secteur d’activité." }),
  size: z.string().optional(),
  city: z.string().optional(),
  description: z.string().max(1000, "La présentation est trop longue (1000 caractères max).").optional(),
});
const accountFields = ["name", "email", "password"];

async function uniqueSlug(name: string) {
  const base = slugify(name) || "entreprise";
  for (let i = 0; i < 3; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const [hit] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, slug)).limit(1);
    if (!hit) return slug;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function registerCompany(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email"),
    password: String(fd.get("password") ?? ""),
    companyName: str(fd, "companyName"),
    sector: str(fd, "sector"),
    size: str(fd, "size") || undefined,
    city: str(fd, "city") || undefined,
    description: str(fd, "description") || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, step: accountFields.includes(String(issue.path[0])) ? 1 : 2 };
  }
  const d = parsed.data;

  let userId: string;
  try {
    const res = await auth.api.signUpEmail({ body: { name: d.name, email: d.email, password: d.password } });
    userId = res.user.id;
  } catch (e) {
    if (e instanceof APIError) {
      const msg = String(e.body?.message ?? "").toLowerCase();
      return {
        step: 1,
        error: msg.includes("exist") ? "Un compte existe déjà avec cet email. Connectez-vous plutôt." : "Impossible de créer le compte. Vérifiez vos informations.",
      };
    }
    throw e;
  }

  try {
    const slug = await uniqueSlug(d.companyName);
    const [company] = await db
      .insert(companies)
      .values({ name: d.companyName, slug, sector: d.sector, size: d.size, city: d.city, description: d.description })
      .returning({ id: companies.id });
    await db.insert(companyMembers).values({ userId, companyId: company.id, role: "ADMIN" });
  } catch {
    await db.delete(user).where(eq(user.id, userId)); // on annule le compte pour ne pas laisser d'utilisateur orphelin
    return { step: 2, error: "L’entreprise n’a pas pu être créée. Réessayez dans un instant." };
  }

  redirect("/dashboard");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Renseignez votre email et votre mot de passe." };

  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch (e) {
    if (e instanceof APIError) return { error: "Email ou mot de passe incorrect." };
    throw e;
  }
  redirect("/dashboard");
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
