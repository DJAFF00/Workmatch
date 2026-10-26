import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion – WorkMatch" };

export default function ConnexionPage() {
  return (
    <AuthLayout
      title="Content de vous revoir."
      subtitle="Connectez-vous à l’espace de votre entreprise."
      footer={<>Pas encore de compte ? <Link href="/inscription-entreprise" className="font-bold text-orange">Inscrire mon entreprise</Link></>}
    >
      <LoginForm />
    </AuthLayout>
  );
}
