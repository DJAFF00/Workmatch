import { after } from "next/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import * as schema from "@/db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { passwordReset } from "@/emails/templates";
import { sendMail } from "@/lib/mail";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60, // le lien est valable 1 heure
    revokeSessionsOnPasswordReset: true, // un nouveau mot de passe déconnecte tous les appareils
    sendResetPassword: async ({ user, url }) => {
      // Limite : 3 emails de réinitialisation par adresse et par 15 minutes (évite d'inonder une boîte mail).
      const [recent] = await db.select({ n: count() }).from(emailLogs).where(
        and(eq(emailLogs.toEmail, user.email), eq(emailLogs.type, "reset"), gte(emailLogs.createdAt, sql`now() - interval '15 minutes'`)),
      );
      if (recent.n >= 3) return;
      const mail = passwordReset({ name: user.name, url });
      after(async () => { await sendMail({ to: user.email, ...mail, type: "reset" }); });
    },
  },
  plugins: [nextCookies()], // doit rester le dernier plugin
});
