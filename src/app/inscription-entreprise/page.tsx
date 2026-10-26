import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Inscrire mon entreprise – WorkMatch" };

export default function InscriptionPage() {
  return (
    <AuthLayout
      title="Recrutez en toute simplicité."
      subtitle="Créez le compte de votre entreprise en deux étapes. C’est gratuit."
      footer={<>Déjà inscrit ? <Link href="/connexion" className="font-bold text-orange">Se connecter</Link></>}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
