"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions";
import { Arrow } from "@/components/arrow";
import { Field, FormError, inputClass } from "@/components/field";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Adresse email">
        <input name="email" type="email" autoComplete="email" required className={inputClass} placeholder="rh@entreprise.com" />
      </Field>
      <Field label="Mot de passe">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <div className="-mt-2 text-right">
        <Link href="/mot-de-passe-oublie" className="text-sm font-semibold text-orange hover:text-orange-deep">Mot de passe oublié ?</Link>
      </div>
      <FormError message={state?.error} />
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] transition hover:bg-orange-deep disabled:opacity-60">
        {pending ? "Connexion…" : <>Se connecter <Arrow /></>}
      </button>
    </form>
  );
}
