import { notFound } from "next/navigation";

import { getCompanyBySlug } from "@/server/company";
import { CompanySiteHeader } from "@/components/layout/company-site-header";
import { CompanySiteFooter } from "@/components/layout/company-site-footer";

export default async function CompanyBoutiqueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const company = await getCompanyBySlug(entreprise);

  if (!company) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CompanySiteHeader entreprise={entreprise} companyName={company.name} />
      <main className="flex-1">{children}</main>
      <CompanySiteFooter entreprise={entreprise} companyName={company.name} />
    </div>
  );
}
