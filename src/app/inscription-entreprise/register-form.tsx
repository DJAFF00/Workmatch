"use client";

import { useActionState, useState } from "react";
import { registerCompany } from "@/lib/actions";
import type { FormState } from "@/lib/form-state";
import { sectorOptions, sizeOptions } from "@/lib/constants";
import { Arrow } from "@/components/arrow";
import { Field, FormError, inputClass } from "@/components/field";

const empty = { name: "", email: "", password: "", companyName: "", sector: "", size: "", city: "", description: "" };
type Values = typeof empty;

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerCompany, undefined);
  const [step, setStep] = useState<1 | 2>(1);
  const [seen, setSeen] = useState<FormState>(undefined);
  const [v, setV] = useState<Values>(empty);
  const [localError, setLocalError] = useState("");

  // Si le serveur renvoie une erreur, on revient à l'étape concernée.
  if (state !== seen) {
    setSeen(state);
    if (state?.step) setStep(state.step);
  }

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  function next() {
    if (v.name.trim().length < 2) return setLocalError("Indiquez votre nom complet.");
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) return setLocalError("Adresse email invalide.");
    if (v.password.length < 8) return setLocalError("Le mot de passe doit contenir au moins 8 caractères.");
    setLocalError("");
    setStep(2);
  }

  return (
    <form
      action={action}
      className="space-y-4"
      onKeyDown={(e) => {
        if (step === 1 && e.key === "Enter") {
          e.preventDefault();
          next();
        }
      }}
    >
      {(Object.keys(v) as (keyof Values)[]).map((k) => <input key={k} type="hidden" name={k} value={v[k]} />)}

      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className={`grid size-7 place-items-center rounded-full ${step === 1 ? "bg-orange text-white" : "bg-orange-soft text-orange-deep"}`}>1</span>
        <span className="h-px w-8 bg-line" />
        <span className={`grid size-7 place-items-center rounded-full ${step === 2 ? "bg-orange text-white" : "bg-white text-muted ring-1 ring-line"}`}>2</span>
        <span className="ml-2 text-muted">{step === 1 ? "Votre compte" : "Votre entreprise"}</span>
      </div>

      {step === 1 ? (
        <>
          <Field label="Nom complet">
            <input value={v.name} onChange={set("name")} autoComplete="name" className={inputClass} placeholder="Awa Kossou" />
          </Field>
          <Field label="Adresse email professionnelle">
            <input value={v.email} onChange={set("email")} type="email" autoComplete="email" className={inputClass} placeholder="rh@entreprise.com" />
          </Field>
          <Field label="Mot de passe" hint="8 caractères minimum.">
            <input value={v.password} onChange={set("password")} type="password" autoComplete="new-password" className={inputClass} />
          </Field>
          <FormError message={localError || state?.error} />
          <button type="button" onClick={next} className="flex w-full items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] transition hover:bg-orange-deep">
            Continuer <Arrow />
          </button>
        </>
      ) : (
        <>
          <Field label="Nom de l’entreprise">
            <input value={v.companyName} onChange={set("companyName")} className={inputClass} placeholder="Atlantic Fiducia" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Secteur d’activité">
              <select value={v.sector} onChange={set("sector")} className={inputClass}>
                <option value="">Choisir…</option>
                {sectorOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Taille (facultatif)">
              <select value={v.size} onChange={set("size")} className={inputClass}>
                <option value="">Choisir…</option>
                {sizeOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Ville (facultatif)">
            <input value={v.city} onChange={set("city")} className={inputClass} placeholder="Cotonou" />
          </Field>
          <Field label="Présentation (facultatif)" hint="Ce texte apparaîtra sur la page de votre entreprise.">
            <textarea value={v.description} onChange={set("description")} rows={3} maxLength={1000} className={inputClass} />
          </Field>
          <FormError message={state?.error} />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-full px-5 py-4 font-semibold text-muted hover:text-ink">Retour</button>
            <button disabled={pending} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] transition hover:bg-orange-deep disabled:opacity-60">
              {pending ? "Création…" : <>Créer mon espace <Arrow /></>}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
