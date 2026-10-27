"use client";

import { createContext, useActionState, useContext, useRef, useState } from "react";
import { deleteAccount } from "@/lib/account-actions";
import { Field, FormError, inputClass } from "@/components/field";

const CloseContext = createContext<() => void>(() => {});

export function DeleteAccount({ companyName, offers, applications }: { companyName: string; offers: number; applications: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0); // remet la fenêtre à zéro à chaque ouverture
  const close = () => { ref.current?.close(); setSession((s) => s + 1); };

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition hover:bg-red-600 hover:text-white">
        Supprimer mon compte
      </button>
      <dialog
        ref={ref}
        onClose={() => setSession((s) => s + 1)}
        onClick={(e) => { if (e.target === ref.current) close(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-[2rem] bg-paper p-0 text-ink backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      >
        <div key={session} className="max-h-[88vh] overflow-y-auto p-6 sm:p-8">
          <CloseContext.Provider value={close}>
            <Flow companyName={companyName} offers={offers} applications={applications} />
          </CloseContext.Provider>
        </div>
      </dialog>
    </>
  );
}

function Flow({ companyName, offers, applications }: { companyName: string; offers: number; applications: number }) {
  const close = useContext(CloseContext);
  const [step, setStep] = useState<1 | 2>(1);
  const [understood, setUnderstood] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? "s" : ""}`;

  if (step === 1) {
    return (
      <div>
        <h2 className="text-2xl font-extrabold">Supprimer définitivement votre compte ?</h2>
        <p className="mt-3 text-muted">Vous êtes sur le point de supprimer l’entreprise « {companyName} ». Seront effacés pour toujours :</p>
        <ul className="mt-4 space-y-2 text-sm">
          {[
            "L’entreprise, sa page publique et son logo",
            `${plural(offers, "offre")} et leur historique`,
            `${plural(applications, "candidature")}, avec les CV, les diplômes, les notes et les entretiens`,
            "Votre compte et vos informations de connexion",
          ].map((t) => (
            <li key={t} className="flex gap-3"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />{t}</li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Cette action est irréversible : nous ne pourrons pas récupérer vos données. Les candidats ne seront pas prévenus.
        </p>
        <label className="mt-5 flex items-start gap-3 text-sm">
          <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-0.5 size-4 accent-red-600" />
          Je comprends que cette suppression est définitive.
        </label>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={close} className="rounded-full bg-white px-6 py-3 text-sm font-semibold ring-1 ring-line hover:ring-orange">Annuler</button>
          <button type="button" disabled={!understood} onClick={() => setStep(2)} className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40">
            Continuer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={action}>
      <h2 className="text-2xl font-extrabold">Confirmez avec votre mot de passe</h2>
      <p className="mt-3 text-muted">Pour des raisons de sécurité, saisissez votre mot de passe. La suppression sera immédiate et définitive.</p>
      <div className="mt-5">
        <Field label="Mot de passe">
          <input name="password" type="password" autoComplete="current-password" autoFocus required className={inputClass} />
        </Field>
      </div>
      <div className="mt-4"><FormError message={state?.error} /></div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => setStep(1)} disabled={pending} className="rounded-full bg-white px-6 py-3 text-sm font-semibold ring-1 ring-line hover:ring-orange disabled:opacity-60">Retour</button>
        <button disabled={pending} className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
          {pending ? "Suppression en cours…" : "Supprimer définitivement"}
        </button>
      </div>
    </form>
  );
}
