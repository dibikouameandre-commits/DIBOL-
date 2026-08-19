import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCompanyBySlug } from "@/server/company";
import { CompanyLoginForm } from "./login-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}): Promise<Metadata> {
  const { entreprise } = await params;
  const company = await getCompanyBySlug(entreprise);
  return { title: company ? `Connexion — ${company.name}` : "Connexion" };
}

export default async function CompanyConnexionPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const company = await getCompanyBySlug(entreprise);
  const base = `/${entreprise}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connecte-toi pour accéder à {company?.name ?? "cette entreprise"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Suspense fallback={null}>
          <CompanyLoginForm entreprise={entreprise} />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href={`${base}/inscription`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
