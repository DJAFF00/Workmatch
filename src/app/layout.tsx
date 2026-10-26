import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "WorkMatch – Offres d'emploi, sans compte à créer",
  description:
    "Parcourez les offres des entreprises et postulez en deux minutes. Recruteurs : publiez vos offres et gérez vos candidatures au même endroit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
