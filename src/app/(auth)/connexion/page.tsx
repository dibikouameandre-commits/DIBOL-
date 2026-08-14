import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte-toi à ton compte DIBOL AI.",
};

export default function ConnexionPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Content de te revoir. Connecte-toi à ton compte.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-medium text-foreground underline underline-offset-4">
            Inscris-toi
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
