"use client";

import { useActionState, useState } from "react";
import { saveJob } from "@/lib/job-actions";
import { contractLabels, currencyOptions, experienceOptions, workModeLabels } from "@/lib/constants";
import { Field, FormError, inputClass } from "@/components/field";

export type Question = { id: string; label: string; required: boolean };
export type JobInitial = Record<string, string>;

const primary = "rounded-full bg-orange px-7 py-3.5 font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,90,15,.7)] transition hover:bg-orange-deep disabled:opacity-60";
const secondary = "rounded-full bg-white px-7 py-3.5 font-semibold ring-1 ring-line transition hover:ring-orange disabled:opacity-60";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="glass space-y-4 rounded-[2rem] p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-extrabold">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function JobForm({ initial = {}, initialQuestions = [], status }: { initial?: JobInitial; initialQuestions?: Question[]; status?: string }) {
  const [state, action, pending] = useActionState(saveJob, undefined);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  // Après une erreur, on réaffiche ce que la personne avait saisi.
  const v = (k: string) => state?.fields?.[k] ?? initial[k] ?? "";

  const updateQ = (id: string, patch: Partial<Question>) => setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  return (
    <form action={action} className="mt-8 space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="questions" value={JSON.stringify(questions)} />

      <Section title="L’essentiel">
        <Field label="Intitulé du poste">
          <input name="title" defaultValue={v("title")} className={inputClass} placeholder="Comptable senior" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type de contrat">
            <select name="contract" defaultValue={v("contract")} className={inputClass}>
              <option value="">Choisir…</option>
              {Object.entries(contractLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Mode de travail">
            <select name="workMode" defaultValue={v("workMode") || "SUR_SITE"} className={inputClass}>
              {Object.entries(workModeLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Lieu">
            <input name="location" defaultValue={v("location")} className={inputClass} placeholder="Cotonou, Bénin" />
          </Field>
          <Field label="Expérience souhaitée (facultatif)">
            <select name="experienceLevel" defaultValue={v("experienceLevel")} className={inputClass}>
              <option value="">Non précisée</option>
              {experienceOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Description du poste" hint="Plus l’offre est claire, plus vous recevrez de candidatures pertinentes.">
        <Field label="Présentation du poste">
          <textarea name="description" defaultValue={v("description")} rows={5} className={inputClass} placeholder="Qui recherchez-vous et pourquoi ce poste existe…" />
        </Field>
        <Field label="Missions (facultatif)" hint="Une mission par ligne.">
          <textarea name="missions" defaultValue={v("missions")} rows={4} className={inputClass} />
        </Field>
        <Field label="Profil et exigences (facultatif)" hint="Diplômes, compétences, expérience. Une exigence par ligne.">
          <textarea name="requirements" defaultValue={v("requirements")} rows={4} className={inputClass} />
        </Field>
        <Field label="Avantages (facultatif)">
          <textarea name="benefits" defaultValue={v("benefits")} rows={3} className={inputClass} />
        </Field>
      </Section>

      <Section title="Rémunération et calendrier" hint="Le salaire est facultatif : laissez vide pour ne pas l’afficher.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Salaire minimum">
            <input name="salaryMin" type="number" min={0} inputMode="numeric" defaultValue={v("salaryMin")} className={inputClass} />
          </Field>
          <Field label="Salaire maximum">
            <input name="salaryMax" type="number" min={0} inputMode="numeric" defaultValue={v("salaryMax")} className={inputClass} />
          </Field>
          <Field label="Devise">
            <select name="salaryCurrency" defaultValue={v("salaryCurrency") || "XOF"} className={inputClass}>
              {currencyOptions.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Date limite de candidature (facultatif)" hint="L’offre cessera d’être proposée après cette date.">
          <input name="deadline" type="date" defaultValue={v("deadline")} className={inputClass} />
        </Field>
      </Section>

      <Section title="Questions pour les candidats" hint="En plus du CV et des diplômes, posez jusqu’à 8 questions propres à ce poste.">
        {questions.length === 0 && <p className="text-sm text-muted">Aucune question pour l’instant.</p>}
        {questions.map((q, i) => (
          <div key={q.id} className="flex flex-wrap items-center gap-3">
            <input
              aria-label={`Question ${i + 1}`}
              value={q.label}
              onChange={(e) => updateQ(q.id, { label: e.target.value })}
              placeholder="Ex. Combien d’années d’expérience avez-vous ?"
              className={`${inputClass} min-w-0 flex-1`}
            />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={q.required} onChange={(e) => updateQ(q.id, { required: e.target.checked })} className="size-4 accent-orange" />
              Obligatoire
            </label>
            <button type="button" onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} className="rounded-full px-3 py-2 text-sm font-semibold text-muted hover:text-orange">
              Retirer
            </button>
          </div>
        ))}
        {questions.length < 8 && (
          <button
            type="button"
            onClick={() => setQuestions((qs) => [...qs, { id: crypto.randomUUID(), label: "", required: false }])}
            className="rounded-full bg-orange-soft px-5 py-2.5 text-sm font-semibold text-orange-deep hover:bg-orange hover:text-white"
          >
            Ajouter une question
          </button>
        )}
      </Section>

      <FormError message={state?.error} />

      <div className="flex flex-wrap items-center gap-3">
        {status === "PUBLIEE" || status === "CLOTUREE" ? (
          <button name="intent" value="keep" disabled={pending} className={primary}>{pending ? "Enregistrement…" : "Enregistrer les modifications"}</button>
        ) : (
          <>
            <button name="intent" value="publish" disabled={pending} className={primary}>{pending ? "Enregistrement…" : "Publier l’offre"}</button>
            <button name="intent" value="draft" disabled={pending} className={secondary}>Enregistrer en brouillon</button>
          </>
        )}
      </div>
    </form>
  );
}
