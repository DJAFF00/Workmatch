import { del, put } from "@vercel/blob";

export const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 Mo au total (limite d'envoi des hébergeurs serverless : 4,5 Mo)
export const MAX_DIPLOMAS = 3;

const types = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
type Kind = keyof typeof types;
const allowedExt = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];

// On vérifie le contenu réel du fichier, pas seulement son nom.
function sniff(b: Uint8Array): Kind | null {
  const is = (...n: number[]) => n.every((v, i) => b[i] === v);
  if (is(0x25, 0x50, 0x44, 0x46)) return "pdf";
  if (is(0x89, 0x50, 0x4e, 0x47)) return "png";
  if (is(0xff, 0xd8, 0xff)) return "jpg";
  if (is(0x50, 0x4b, 0x03, 0x04)) return "docx";
  if (is(0xd0, 0xcf, 0x11, 0xe0)) return "doc";
  return null;
}

export type CheckedFile = { kind: Kind; data: Buffer };

export async function checkFile(file: File): Promise<CheckedFile | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExt.includes(ext)) return null;
  const data = Buffer.from(await file.arrayBuffer());
  const kind = sniff(data);
  return kind ? { kind, data } : null;
}

export function storageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// Stockage PRIVÉ : les fichiers ne sont lisibles que via une route protégée du dashboard.
export async function uploadPrivate(f: CheckedFile, folder: string, name: string) {
  const pathname = `candidatures/${folder}/${name}.${f.kind}`;
  await put(pathname, f.data, { access: "private", contentType: types[f.kind], addRandomSuffix: false });
  return pathname;
}

export async function removeFiles(pathnames: string[]) {
  try {
    if (pathnames.length) await del(pathnames);
  } catch {
    // nettoyage au mieux
  }
}

// ---------- Logos (images uniquement, 1 Mo maximum) ----------
export const MAX_LOGO_BYTES = 1024 * 1024;
const imageTypes = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" } as const;
export type ImageKind = keyof typeof imageTypes;

export async function checkImage(file: File): Promise<{ kind: ImageKind; data: Buffer } | null> {
  const data = Buffer.from(await file.arrayBuffer());
  const is = (...n: number[]) => n.every((v, i) => data[i] === v);
  const kind: ImageKind | null = is(0x89, 0x50, 0x4e, 0x47) ? "png" : is(0xff, 0xd8, 0xff) ? "jpg"
    : is(0x52, 0x49, 0x46, 0x46) && data.subarray(8, 12).toString() === "WEBP" ? "webp" : null;
  return kind ? { kind, data } : null;
}

export async function uploadLogo(img: { kind: ImageKind; data: Buffer }, companyId: string) {
  const pathname = `logos/${companyId}/${crypto.randomUUID()}.${img.kind}`;
  await put(pathname, img.data, { access: "private", contentType: imageTypes[img.kind], addRandomSuffix: false });
  return pathname;
}

// Suppression stricte (compte supprimé) : si un fichier ne peut pas être effacé, on le signale au lieu de l'ignorer.
export async function deleteFilesStrict(pathnames: string[]) {
  for (let i = 0; i < pathnames.length; i += 100) await del(pathnames.slice(i, i + 100));
}
