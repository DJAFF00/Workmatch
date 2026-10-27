export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

function layout(body: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f6f7fa;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:100%;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:#0f172a;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:800">Work<span style="color:#ff5a0f">Match</span></td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:16px 28px;color:#64748b;font-size:12px;border-top:1px solid #e6e8ef">Cet email a été envoyé automatiquement par WorkMatch.</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0 0"><a href="${esc(href)}" style="background:#ff5a0f;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px;display:inline-block">${esc(label)}</a></p>`;

export function applicationReceived(p: { name: string; jobTitle: string; company: string; jobSlug: string }) {
  return {
    subject: `Votre candidature chez ${p.company} a bien été reçue`,
    html: layout(`<h1 style="font-size:22px;margin:0 0 12px">Bonjour ${esc(p.name)},</h1>
<p>Nous avons bien reçu votre candidature au poste de <strong>${esc(p.jobTitle)}</strong> chez <strong>${esc(p.company)}</strong>.</p>
<p>L’entreprise va l’étudier. Si votre profil est retenu, elle vous contactera directement à cette adresse email.</p>
${button(`${appUrl()}/offres/${p.jobSlug}`, "Revoir l’offre")}`),
  };
}

export function newApplicationNotice(p: { candidate: string; jobTitle: string }) {
  return {
    subject: `Nouvelle candidature : ${p.jobTitle}`,
    html: layout(`<h1 style="font-size:22px;margin:0 0 12px">Nouvelle candidature</h1>
<p><strong>${esc(p.candidate)}</strong> vient de postuler à l’offre <strong>${esc(p.jobTitle)}</strong>.</p>
${button(`${appUrl()}/dashboard/candidatures`, "Voir la candidature")}`),
  };
}

export function contactMessage(p: { company: string; body: string; subject: string }) {
  return {
    subject: p.subject,
    html: layout(`<div>${esc(p.body).replace(/\n/g, "<br>")}</div>
<p style="margin:24px 0 0;color:#64748b;font-size:13px">Message envoyé par ${esc(p.company)} via WorkMatch. Vous pouvez répondre directement à cet email.</p>`),
  };
}

export function interviewInvitation(p: {
  name: string; jobTitle: string; company: string; dateLabel: string; timeLabel: string;
  modeLabel: string; place?: string | null; message?: string | null;
}) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#64748b;vertical-align:top">${k}</td><td style="padding:6px 0;font-weight:700">${v}</td></tr>`;
  return {
    subject: `Invitation à un entretien – ${p.jobTitle} (${p.company})`,
    html: layout(`<h1 style="font-size:22px;margin:0 0 12px">Bonjour ${esc(p.name)},</h1>
<p>Bonne nouvelle : <strong>${esc(p.company)}</strong> souhaite vous rencontrer pour le poste de <strong>${esc(p.jobTitle)}</strong>.</p>
<table cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f6f7fa;border-radius:14px;padding:12px 18px;width:100%">
${row("Poste", esc(p.jobTitle))}${row("Date", esc(p.dateLabel))}${row("Heure", esc(p.timeLabel) + " (heure du Bénin)")}${row("Format", esc(p.modeLabel))}${p.place ? row("Lieu / lien", esc(p.place)) : ""}
</table>
${p.message ? `<p>${esc(p.message).replace(/\n/g, "<br>")}</p>` : ""}
<p>Une invitation de calendrier est jointe à cet email. Pour confirmer ou signaler un empêchement, répondez directement à ce message.</p>`),
  };
}

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Heure « flottante » : l'événement apparaît à l'heure saisie, dans le calendrier du candidat.
export function buildIcs(p: { id: string; start: Date; title: string; location?: string | null; description?: string }) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 15);
  const end = new Date(p.start.getTime() + 60 * 60 * 1000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WorkMatch//FR", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${p.id}@workmatch`, `DTSTAMP:${f(new Date())}Z`, `DTSTART:${f(p.start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${icsText(p.title)}`,
    ...(p.location ? [`LOCATION:${icsText(p.location)}`] : []),
    ...(p.description ? [`DESCRIPTION:${icsText(p.description)}`] : []),
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function passwordReset(p: { name: string; url: string }) {
  return {
    subject: "Réinitialisez votre mot de passe WorkMatch",
    html: layout(`<h1 style="font-size:22px;margin:0 0 12px">Bonjour ${esc(p.name)},</h1>
<p>Vous avez demandé à réinitialiser le mot de passe de votre compte WorkMatch. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
${button(p.url, "Choisir un nouveau mot de passe")}
<p style="margin:24px 0 0;color:#64748b;font-size:13px">Ce lien est valable 1 heure. Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : votre mot de passe ne sera pas modifié.</p>`),
  };
}
