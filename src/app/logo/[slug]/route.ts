import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";

// Sert le logo d'une entreprise (public). Le fichier reste dans le stockage privé : seul ce logo est exposé.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [c] = await db.select({ logo: companies.logoUrl }).from(companies).where(eq(companies.slug, slug)).limit(1);
  if (!c?.logo) return new Response("Introuvable", { status: 404 });

  const blob = await get(c.logo, { access: "private" });
  if (!blob || blob.statusCode !== 200) return new Response("Introuvable", { status: 404 });

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:",
    },
  });
}
