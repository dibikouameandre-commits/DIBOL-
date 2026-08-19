import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompanyBySlug } from "@/server/company";

export default async function CompanyAuthLayout({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Link href={`/${entreprise}`} className="text-2xl font-bold tracking-tight">
        {company.name}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
