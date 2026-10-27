import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Mot de passe oublié – WorkMatch" };

export default function MotDePasseOubliePage() {
  return (
    <AuthLayout
      title="Mot de passe oublié ?"
      subtitle="Saisissez l’adresse email de votre compte : nous vous enverrons un lien pour en choisir un nouveau."
      footer={<>Vous vous en souvenez ? <Link href="/connexion" className="font-bold text-orange">Se connecter</Link></>}
    >
      <ForgotForm />
    </AuthLayout>
  );
}
