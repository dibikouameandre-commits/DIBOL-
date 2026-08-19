import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCompanyBySlug } from "@/server/company";
import { CompanyRegisterForm } from "./register-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}): Promise<Metadata> {
  const { entreprise } = await params;
  const company = await getCompanyBySlug(entreprise);
  return { title: company ? `Inscription — ${company.name}` : "Inscription" };
}

export default async function CompanyInscriptionPage({
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
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Inscris-toi pour commencer à acheter chez {company?.name ?? "cette entreprise"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CompanyRegisterForm entreprise={entreprise} />
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link
            href={`${base}/connexion`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Connecte-toi
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
