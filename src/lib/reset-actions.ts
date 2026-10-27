"use server";

import { APIError } from "better-auth";
import { z } from "zod";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/form-state";

const baseUrl = () => (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export async function requestReset(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const email = z.email("Adresse email invalide.").safeParse(String(fd.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: email.error.issues[0].message };

  try {
    await auth.api.requestPasswordReset({ body: { email: email.data, redirectTo: `${baseUrl()}/reinitialiser-mot-de-passe` } });
  } catch (e) {
    if (!(e instanceof APIError)) throw e;
  }
  // Même réponse que le compte existe ou non : on ne révèle jamais quelles adresses sont inscrites.
  return { success: true };
}

export async function resetPassword(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const token = String(fd.get("token") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!token) return { error: "Ce lien est invalide. Refaites une demande." };
  if (next.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (next !== String(fd.get("confirm") ?? "")) return { error: "La confirmation ne correspond pas au mot de passe." };

  try {
    await auth.api.resetPassword({ body: { newPassword: next, token } });
  } catch (e) {
    if (e instanceof APIError) return { error: "Ce lien est invalide ou a expiré. Refaites une demande de réinitialisation." };
    throw e;
  }
  return { success: true };
}
