"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitApplication } from "@/lib/apply-actions";
import { Arrow } from "@/components/arrow";
import { Field, FormError, inputClass } from "@/components/field";

type Question = { id: string; label: string; required: boolean };
const MAX = 4 * 1024 * 1024;
const fileClass = `${inputClass} cursor-pointer file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-orange-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-deep`;

export function ApplyForm({ slug, jobTitle, questions }: { slug: string; jobTitle: string; questions: Question[] }) {
  const [state, action, pending] = useActionState(submitApplication, undefined);
  const [sizes, setSizes] = useState<{ cv: number; diplomas: number }>({ cv: 0, diplomas: 0 });
  const total = sizes.cv + sizes.diplomas;
  const tooBig = total > MAX;
  const v = (k: string) => state?.fields?.[k] ?? "";

  if (state?.success) {
    return (
      <div className="glass rounded-[2rem] p-8 text-center sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-orange text-2xl text-white" aria-hidden>✓</span>
        <h2 className="mt-5 text-3xl font-extrabold">Candidature envoyée</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Votre dossier pour « {jobTitle} » a bien été transmis. Vous recevrez un email de confirmation, puis une réponse de l’entreprise si votre profil est retenu.
        </p>
        <Link href="/offres" className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white hover:bg-orange-deep">
          Voir d’autres offres <Arrow />
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="glass space-y-5 rounded-[2rem] p-6 sm:p-8">
      <input type="hidden" name="slug" value={slug} />
      {/* Champ piège anti-robots : ne pas remplir */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Ne pas remplir <input name="website_url" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet"><input name="fullName" defaultValue={v("fullName")} autoComplete="name" required className={inputClass} /></Field>
        <Field label="Adresse email" hint="Les réponses vous seront envoyées ici."><input name="email" type="email" defaultValue={v("email")} autoComplete="email" required className={inputClass} /></Field>
        <Field label="Téléphone (facultatif)"><input name="phone" type="tel" defaultValue={v("phone")} autoComplete="tel" className={inputClass} /></Field>
        <Field label="Ville (facultatif)"><input name="city" defaultValue={v("city")} autoComplete="address-level2" className={inputClass} /></Field>
      </div>

      <Field label="CV" hint="PDF, Word, JPG ou PNG.">
        <input name="cv" type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className={fileClass}
          onChange={(e) => setSizes((s) => ({ ...s, cv: e.target.files?.[0]?.size ?? 0 }))} />
      </Field>
      <Field label="Diplômes et attestations (facultatif)" hint="3 fichiers maximum.">
        <input name="diplomas" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className={fileClass}
          onChange={(e) => setSizes((s) => ({ ...s, diplomas: Array.from(e.target.files ?? []).reduce((n, f) => n + f.size, 0) }))} />
      </Field>
      <p className={`text-xs ${tooBig ? "font-semibold text-orange-deep" : "text-muted"}`}>
        Taille totale : {(total / 1024 / 1024).toFixed(1)} Mo sur 4 Mo maximum.
        {state?.error && " Si une erreur s’est produite, sélectionnez à nouveau vos fichiers."}
      </p>

      <Field label="Lettre de motivation (facultatif)">
        <textarea name="coverLetter" defaultValue={v("coverLetter")} rows={5} maxLength={3000} className={inputClass} />
      </Field>

      {questions.length > 0 && (
        <div className="space-y-4 border-t border-line pt-5">
          <p className="font-bold">Questions de l’entreprise</p>
          {questions.map((q) => (
            <Field key={q.id} label={`${q.label}${q.required ? " *" : ""}`}>
              <textarea name={`q_${q.id}`} defaultValue={v(`q_${q.id}`)} rows={2} maxLength={1000} required={q.required} className={inputClass} />
            </Field>
          ))}
        </div>
      )}

      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-orange" />
        J’accepte que mes informations et mes documents soient transmis à l’entreprise pour le traitement de ma candidature. Je peux demander leur suppression à tout moment.
      </label>

      <FormError message={state?.error} />
      <button disabled={pending || tooBig} className="flex w-full items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] transition hover:bg-orange-deep disabled:opacity-60">
        {pending ? "Envoi en cours…" : <>Envoyer ma candidature <Arrow /></>}
      </button>
    </form>
  );
}
