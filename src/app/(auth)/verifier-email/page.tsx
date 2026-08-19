import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { verifyEmailToken } from "@/server/email-verification";

export const metadata: Metadata = {
  title: "Vérification de l'email",
  robots: { index: false },
};

export default async function VerifierEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;
  const result =
    email && token
      ? await verifyEmailToken(email, token)
      : { success: false as const, error: "Lien de vérification invalide." };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle2 className="size-5 text-primary" />
          ) : (
            <XCircle className="size-5 text-destructive" />
          )}
          <CardTitle>
            {result.success ? "Email confirmé" : "Vérification impossible"}
          </CardTitle>
        </div>
        <CardDescription>
          {result.success
            ? "Ton adresse email a bien été confirmée."
            : result.error}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/connexion"
          className="text-sm font-medium text-foreground underline underline-offset-4"
        >
          Aller à la connexion
        </Link>
      </CardContent>
    </Card>
  );
}
