"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { jobs } from "@/db/schema";

// Compte une vue sur une offre publiée (appelé une fois par session depuis la page de l'offre).
export async function recordView(slug: string) {
  const parsed = z.string().min(1).max(120).safeParse(slug);
  if (!parsed.success) return;
  await db.update(jobs).set({ views: sql`${jobs.views} + 1` }).where(and(eq(jobs.slug, parsed.data), eq(jobs.status, "PUBLIEE")));
}
