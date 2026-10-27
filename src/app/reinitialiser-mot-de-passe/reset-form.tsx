"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/lib/reset-actions";
import { Arrow } from "@/components/arrow";
import { Field, FormError, inputClass } from "@/components/field";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  if (state?.success) {
    return (
      <div role="status" className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-orange text-xl text-white" aria-hidden>✓</span>
        <p className="mt-4 text-lg font-extrabold">Mot de passe modifié</p>
        <p className="mt-2 text-sm text-muted">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe. Vos autres appareils ont été déconnectés.</p>
        <Link href="/connexion" className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white hover:bg-orange-deep">Se connecter <Arrow /></Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label="Nouveau mot de passe" hint="8 caractères minimum.">
        <input name="next" type="password" autoComplete="new-password" required autoFocus className={inputClass} />
      </Field>
      <Field label="Confirmer le mot de passe">
        <input name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
      </Field>
      <FormError message={state?.error} />
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] transition hover:bg-orange-deep disabled:opacity-60">
        {pending ? "Enregistrement…" : <>Enregistrer le mot de passe <Arrow /></>}
      </button>
    </form>
  );
}
