export * from "./auth-schema";

import {
  pgTable, pgEnum, uuid, text, timestamp, integer, boolean, jsonb, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------
export const contractType = pgEnum("contract_type", [
  "CDI", "CDD", "STAGE", "FREELANCE", "ALTERNANCE", "TEMPS_PARTIEL",
]);
export const workMode = pgEnum("work_mode", ["SUR_SITE", "HYBRIDE", "TELETRAVAIL"]);
export const jobStatus = pgEnum("job_status", ["BROUILLON", "PUBLIEE", "CLOTUREE"]);
export const applicationStatus = pgEnum("application_status", [
  "NOUVEAU", "PRESELECTIONNE", "ENTRETIEN", "REFUSE", "EMBAUCHE",
]);
export const interviewMode = pgEnum("interview_mode", ["PRESENTIEL", "VISIO", "TELEPHONE"]);
export const memberRole = pgEnum("member_role", ["ADMIN", "RECRUTEUR"]);

// ---------- Entreprises ----------
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sector: text("sector").notNull(),
  size: text("size"),
  description: text("description"),
  website: text("website"),
  logoUrl: text("logo_url"),
  city: text("city"),
  country: text("country"),
  plan: text("plan").notNull().default("GRATUIT"), // GRATUIT | PRO
  planUntil: timestamp("plan_until"), // fin du plan Pro (vide = sans limite de durée)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lien entre un utilisateur (table gérée par l'auth, étape suivante) et une entreprise
export const companyMembers = pgTable("company_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  role: memberRole("role").notNull().default("ADMIN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("member_unique").on(t.userId, t.companyId)]);

// ---------- Offres ----------
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  missions: text("missions"),
  requirements: text("requirements"),
  benefits: text("benefits"),
  contract: contractType("contract").notNull(),
  workMode: workMode("work_mode").notNull().default("SUR_SITE"),
  location: text("location").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("XOF"),
  experienceLevel: text("experience_level"),
  deadline: timestamp("deadline"),
  status: jobStatus("status").notNull().default("BROUILLON"),
  // Questions personnalisées posées au candidat : [{ id, label, required }]
  customQuestions: jsonb("custom_questions").$type<{ id: string; label: string; required: boolean }[]>().default([]),
  views: integer("views").notNull().default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("jobs_company_idx").on(t.companyId),
  index("jobs_status_idx").on(t.status),
]);

// ---------- Candidatures (le candidat n'a pas de compte) ----------
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city"),
  cvUrl: text("cv_url").notNull(),
  diplomaUrls: jsonb("diploma_urls").$type<string[]>().default([]),
  coverLetter: text("cover_letter"),
  answers: jsonb("answers").$type<Record<string, string>>().default({}),
  status: applicationStatus("status").notNull().default("NOUVEAU"),
  rating: integer("rating"),
  consent: boolean("consent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("applications_job_idx").on(t.jobId),
  uniqueIndex("applications_job_email_unique").on(t.jobId, t.email), // pas de doublon
]);

// ---------- Entretiens ----------
export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  jobTitle: text("job_title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  mode: interviewMode("mode").notNull().default("PRESENTIEL"),
  locationOrLink: text("location_or_link"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Notes internes ----------
export const applicationNotes = pgTable("application_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Historique des emails ----------
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  type: text("type").notNull(), // accuse | contact | entretien | refus
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Relations ----------
export const companiesRelations = relations(companies, ({ many }) => ({
  jobs: many(jobs),
  members: many(companyMembers),
}));
export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  applications: many(applications),
}));
export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  interviews: many(interviews),
  notes: many(applicationNotes),
}));
export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, { fields: [interviews.applicationId], references: [applications.id] }),
}));
