"use client";

import { useActionState } from "react";
import { changePassword, removeLogo, saveLogo, updateAccountName, updateCompany } from "@/lib/settings-actions";
import { sectorOptions, sizeOptions } from "@/lib/constants";
import { CompanyLogo } from "@/components/job-card";
import { ConfirmButton } from "@/components/confirm-button";
import { Field, FormError, inputClass } from "@/components/field";

const primary = "rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(255,90,15,.6)] transition hover:bg-orange-deep disabled:opacity-60";
const fileClass = `${inputClass} cursor-pointer file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-orange-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-deep`;

export function Saved({ show }: { show?: boolean }) {
  if (!show) return null;
  return <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Modifications enregistrées.</p>;
}

export type CompanyValues = { name: string; sector: string; size: string; city: string; country: string; website: string; description: string };

export function CompanyForm({ values }: { values: CompanyValues }) {
  const [state, action, pending] = useActionState(updateCompany, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Nom de l’entreprise"><input name="name" defaultValue={values.name} className={inputClass} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Secteur d’activité">
          <select name="sector" defaultValue={values.sector} className={inputClass}>
            {sectorOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Taille">
          <select name="size" defaultValue={values.size} className={inputClass}>
            <option value="">Non précisée</option>
            {sizeOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Ville"><input name="city" defaultValue={values.city} className={inputClass} /></Field>
        <Field label="Pays"><input name="country" defaultValue={values.country} className={inputClass} /></Field>
      </div>
      <Field label="Site web" hint="Ex. www.monentreprise.com"><input name="website" defaultValue={values.website} className={inputClass} /></Field>
      <Field label="Présentation" hint="Affichée sur la page publique de votre entreprise.">
        <textarea name="description" defaultValue={values.description} rows={5} maxLength={1000} className={inputClass} />
      </Field>
      <FormError message={state?.error} />
      <Saved show={state?.success} />
      <button disabled={pending} className={primary}>{pending ? "Enregistrement…" : "Enregistrer le profil"}</button>
    </form>
  );
}

export function LogoForm({ name, logo }: { name: string; logo: string | null }) {
  const [state, action, pending] = useActionState(saveLogo, undefined);
  return (
    <div className="flex flex-wrap items-start gap-6">
      <CompanyLogo name={name} logo={logo} size="size-24 text-4xl rounded-3xl" />
      <div className="min-w-0 flex-1 space-y-3">
        <form action={action} className="space-y-3">
          <Field label={logo ? "Remplacer le logo" : "Ajouter un logo"} hint="PNG, JPG ou WebP, 1 Mo maximum. Idéalement carré.">
            <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className={fileClass} />
          </Field>
          <FormError message={state?.error} />
          <Saved show={state?.success} />
          <button disabled={pending} className={primary}>{pending ? "Envoi…" : "Enregistrer le logo"}</button>
        </form>
        {logo && (
          <form action={removeLogo}>
            <ConfirmButton message="Supprimer le logo de votre entreprise ?" className="text-sm font-semibold text-muted hover:text-orange">Supprimer le logo</ConfirmButton>
          </form>
        )}
      </div>
    </div>
  );
}

export function AccountForms({ name, email }: { name: string; email: string }) {
  const [nameState, nameAction, namePending] = useActionState(updateAccountName, undefined);
  const [pwState, pwAction, pwPending] = useActionState(changePassword, undefined);
  return (
    <div className="space-y-8">
      <form action={nameAction} className="space-y-4">
        <Field label="Votre nom"><input name="name" defaultValue={name} className={inputClass} /></Field>
        <Field label="Adresse email" hint="L’adresse de connexion ne peut pas être modifiée ici."><input value={email} readOnly className={`${inputClass} bg-paper text-muted`} /></Field>
        <FormError message={nameState?.error} />
        <Saved show={nameState?.success} />
        <button disabled={namePending} className={primary}>{namePending ? "Enregistrement…" : "Enregistrer"}</button>
      </form>

      <form action={pwAction} className="space-y-4 border-t border-line pt-8">
        <p className="font-bold">Changer le mot de passe</p>
        <Field label="Mot de passe actuel"><input name="current" type="password" autoComplete="current-password" className={inputClass} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nouveau mot de passe" hint="8 caractères minimum."><input name="next" type="password" autoComplete="new-password" className={inputClass} /></Field>
          <Field label="Confirmer"><input name="confirm" type="password" autoComplete="new-password" className={inputClass} /></Field>
        </div>
        <FormError message={pwState?.error} />
        {pwState?.success && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Mot de passe modifié. Vos autres appareils ont été déconnectés.</p>}
        <button disabled={pwPending} className={primary}>{pwPending ? "Modification…" : "Modifier le mot de passe"}</button>
      </form>
    </div>
  );
}
