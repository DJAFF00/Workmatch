import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { effectivePlan, plans } from "@/lib/plans";

export async function activeJobCount(companyId: string, excludeJobId?: string) {
  const [r] = await db.select({ n: count() }).from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.status, "PUBLIEE"), excludeJobId ? ne(jobs.id, excludeJobId) : undefined));
  return r.n;
}

// Renvoie un message d'erreur si la publication d'une offre de plus dépasse le plan, sinon null.
export async function publishLimitError(company: { id: string; plan: string; planUntil: Date | null }, excludeJobId?: string) {
  const plan = plans[effectivePlan(company.plan, company.planUntil)];
  if (plan.maxActiveJobs == null) return null;
  const n = await activeJobCount(company.id, excludeJobId);
  return n >= plan.maxActiveJobs
    ? `Votre plan ${plan.name} permet ${plan.maxActiveJobs} offres publiées en même temps. Clôturez une offre ou passez au plan Pro.`
    : null;
}
