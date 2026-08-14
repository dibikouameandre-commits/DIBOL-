import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Crée ton compte DIBOL AI.",
};

export default function InscriptionPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Inscris-toi pour commencer à acheter sur DIBOL AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-medium text-foreground underline underline-offset-4">
            Connecte-toi
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
