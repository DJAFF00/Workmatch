// Formats déterministes (même rendu côté serveur et navigateur).
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(iso));
}

export function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (min == null && max == null) return null;
  const n = (v: number) => new Intl.NumberFormat("fr-FR").format(v);
  const cur = currency ?? "XOF";
  if (min != null && max != null) return `${n(min)} – ${n(max)} ${cur}`;
  return min != null ? `À partir de ${n(min)} ${cur}` : `Jusqu’à ${n(max as number)} ${cur}`;
}

export function toLines(text: string | null) {
  return (text ?? "").split("\n").map((l) => l.replace(/^[\s\-•*–]+/, "").trim()).filter(Boolean);
}

export function toParagraphs(text: string) {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

// Les dates d'entretien sont stockées « à l'heure du mur » (l'heure saisie par le recruteur, fuseau du Bénin)
// et toujours affichées en UTC pour retrouver exactement l'heure saisie, quel que soit le serveur.
export const APP_TIMEZONE = "Africa/Porto-Novo";

export function wallClockNow() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
}

export const formatLongDate = (d: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "UTC" }).format(d);
export const formatTime = (d: Date) => new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "UTC" }).format(d);
export const formatDateTime = (d: Date) => `${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(d)} à ${formatTime(d)}`;
