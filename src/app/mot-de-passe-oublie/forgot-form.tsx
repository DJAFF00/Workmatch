"use client";

import { useActionState } from "react";
import { requestReset } from "@/lib/reset-actions";
import { Arrow } from "@/components/arrow";
import { Field, FormError, inputClass } from "@/components/field";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestReset, undefined);

  if (state?.success) {
    return (
      <div role="status" className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-orange text-xl text-white" aria-hidden>✓</span>
        <p className="mt-4 text-lg font-extrabold">Vérifiez votre boîte mail</p>
        <p className="mt-2 text-sm text-muted">
          Si un compte existe avec cette adresse, un email vient d’être envoyé. Le lien est valable 1 heure. Pensez à regarder dans vos courriers indésirables.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Adresse email">
        <input name="email" type="email" autoComplete="email" required autoFocus className={inputClass} placeholder="rh@entreprise.com" />
      </Field>
      <FormError message={state?.error} />
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] transition hover:bg-orange-deep disabled:opacity-60">
        {pending ? "Envoi…" : <>Envoyer le lien <Arrow /></>}
      </button>
    </form>
  );
}
