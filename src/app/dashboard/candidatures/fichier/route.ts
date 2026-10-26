import type { NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { requireCompany } from "@/lib/session";
import { slugify } from "@/lib/utils";

// Télécharge un fichier de candidature, uniquement pour l'entreprise propriétaire de l'offre.
export async function GET(req: NextRequest) {
  const { company } = await requireCompany();

  const id = z.uuid().safeParse(req.nextUrl.searchParams.get("c"));
  const f = req.nextUrl.searchParams.get("f") ?? "";
  if (!id.success || !/^(cv|d[0-2])$/.test(f)) return new Response("Requête invalide", { status: 400 });

  const [row] = await db
    .select({ cv: applications.cvUrl, diplomas: applications.diplomaUrls, name: applications.fullName })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(applications.id, id.data), eq(jobs.companyId, company.id)))
    .limit(1);

  const pathname = f === "cv" ? row?.cv : row?.diplomas?.[Number(f.slice(1))];
  if (!row || !pathname) return new Response("Fichier introuvable", { status: 404 });

  const blob = await get(pathname, { access: "private" });
  if (!blob || blob.statusCode !== 200) return new Response("Fichier introuvable", { status: 404 });

  const ext = pathname.split(".").pop() ?? "bin";
  const inline = ["pdf", "png", "jpg"].includes(ext);
  const filename = `${slugify(row.name) || "candidat"}-${f === "cv" ? "cv" : `diplome-${Number(f.slice(1)) + 1}`}.${ext}`;

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
