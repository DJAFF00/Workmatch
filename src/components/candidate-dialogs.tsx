"use client";

import { createContext, useActionState, useContext, useRef, useState } from "react";
import { scheduleInterview, sendContactEmail } from "@/lib/candidate-actions";
import { interviewModeLabels } from "@/lib/constants";
import { Field, FormError, inputClass } from "@/components/field";
import { Arrow } from "@/components/arrow";

const primary = "flex items-center justify-center gap-2 rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(255,90,15,.6)] transition hover:bg-orange-deep disabled:opacity-60";
const secondary = "rounded-full bg-white px-6 py-3 text-sm font-semibold ring-1 ring-line transition hover:ring-orange hover:text-orange";

const CloseContext = createContext<() => void>(() => {});

function Modal({ label, title, className, children }: {
  label: string; title: string; className: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0); // remet le formulaire à zéro à chaque ouverture
  const close = () => { ref.current?.close(); setSession((s) => s + 1); };
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>{label}</button>
      <dialog
        ref={ref}
        onClose={() => setSession((s) => s + 1)}
        onClick={(e) => { if (e.target === ref.current) close(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-[2rem] bg-paper p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-extrabold">{title}</h2>
            <button type="button" onClick={close} aria-label="Fermer" className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-line hover:text-orange">✕</button>
          </div>
          <div key={session} className="mt-5"><CloseContext.Provider value={close}>{children}</CloseContext.Provider></div>
        </div>
      </dialog>
    </>
  );
}

function Done({ text, warning }: { text: string; warning?: string }) {
  const close = useContext(CloseContext);
  return (
    <div className="py-4 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-orange text-xl text-white" aria-hidden>✓</span>
      <p className="mt-4 text-lg font-extrabold">{text}</p>
      {warning && <p className="mt-3 rounded-2xl bg-orange-soft px-4 py-3 text-left text-sm font-semibold text-orange-deep">{warning}</p>}
      <button type="button" onClick={close} className={`${secondary} mt-6`}>Fermer</button>
    </div>
  );
}

export function ContactDialog({ id, name, email, jobTitle, company }: { id: string; name: string; email: string; jobTitle: string; company: string }) {
  return (
    <Modal label="Contacter par email" title={`Écrire à ${name}`} className={secondary}>
      <ContactForm id={id} email={email} name={name} jobTitle={jobTitle} company={company} />
    </Modal>
  );
}

function ContactForm({ id, email, name, jobTitle, company }: { id: string; email: string; name: string; jobTitle: string; company: string }) {
  const [state, action, pending] = useActionState(sendContactEmail, undefined);
  const [subject, setSubject] = useState(`Votre candidature – ${jobTitle}`);
  const [message, setMessage] = useState("");
  const first = name.split(" ")[0];

  const templates = {
    "Demande d’informations": `Bonjour ${first},\n\nMerci pour votre candidature au poste de ${jobTitle}. Pour avancer dans l’étude de votre dossier, pourriez-vous nous préciser les points suivants :\n- \n\nCordialement,\n${company}`,
    "Refus courtois": `Bonjour ${first},\n\nNous vous remercions d’avoir postulé au poste de ${jobTitle} chez ${company} et de l’intérêt que vous portez à notre entreprise.\n\nAprès étude attentive de votre dossier, nous ne pouvons malheureusement pas donner suite à votre candidature pour ce poste.\n\nNous vous souhaitons plein succès dans vos recherches.\n\nCordialement,\n${company}`,
  };

  if (state?.success) return <Done text="Email envoyé" />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-muted">À : <strong className="text-ink">{email}</strong>. Le candidat pourra vous répondre directement.</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(templates).map(([label, text]) => (
          <button key={label} type="button" onClick={() => setMessage(text)} className="rounded-full bg-orange-soft px-4 py-2 text-xs font-semibold text-orange-deep hover:bg-orange hover:text-white">{label}</button>
        ))}
      </div>
      <Field label="Objet"><input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} /></Field>
      <Field label="Message"><textarea name="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className={inputClass} /></Field>
      <FormError message={state?.error} />
      <button disabled={pending} className={primary}>{pending ? "Envoi…" : <>Envoyer <Arrow /></>}</button>
    </form>
  );
}

export function InterviewDialog({ id, name, email, jobTitle }: { id: string; name: string; email: string; jobTitle: string }) {
  return (
    <Modal label="Appeler pour un entretien" title="Programmer un entretien" className={primary}>
      <InterviewForm id={id} name={name} email={email} jobTitle={jobTitle} />
    </Modal>
  );
}

function InterviewForm({ id, name, email, jobTitle }: { id: string; name: string; email: string; jobTitle: string }) {
  const [state, action, pending] = useActionState(scheduleInterview, undefined);
  const [mode, setMode] = useState("PRESENTIEL");

  if (state?.success) return <Done text="Entretien programmé" warning={state.warning} />;
  const placeLabel = mode === "VISIO" ? "Lien de la visioconférence" : mode === "PRESENTIEL" ? "Lieu de l’entretien" : "Numéro ou précision (facultatif)";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Poste"><input name="jobTitle" defaultValue={jobTitle} className={inputClass} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date"><input name="date" type="date" className={inputClass} /></Field>
        <Field label="Heure" hint="Heure du Bénin."><input name="time" type="time" className={inputClass} /></Field>
      </div>
      <Field label="Format">
        <select name="mode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
          {Object.entries(interviewModeLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Field>
      <Field label={placeLabel}><input name="place" className={inputClass} placeholder={mode === "VISIO" ? "https://meet.google.com/…" : mode === "PRESENTIEL" ? "Adresse du bureau" : ""} /></Field>
      <Field label="Message pour le candidat (facultatif)"><textarea name="message" rows={3} className={inputClass} /></Field>
      <p className="text-xs text-muted">À la validation, un email avec la date, l’heure et l’intitulé du poste sera envoyé à <strong>{name}</strong> ({email}).</p>
      <FormError message={state?.error} />
      <button disabled={pending} className={primary}>{pending ? "Envoi…" : <>Valider et envoyer l’invitation <Arrow /></>}</button>
    </form>
  );
}
