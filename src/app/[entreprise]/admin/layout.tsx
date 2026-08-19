import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireCompanyAdmin } from "@/server/admin/guard";
import { CompanyAdminNav } from "./admin-nav";
import { MobileCompanyAdminNav } from "./mobile-admin-nav";

export default async function CompanyAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const { session, company } = await requireCompanyAdmin(entreprise);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r bg-muted/20 p-4 lg:flex">
        <div className="px-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Administration
          </div>
          <div className="text-lg font-bold tracking-tight">{company.name}</div>
        </div>
        <CompanyAdminNav entreprise={entreprise} />
        <div className="mt-auto flex flex-col gap-2 px-2">
          <span className="truncate text-xs text-muted-foreground">
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <MobileCompanyAdminNav entreprise={entreprise} />
            <span className="font-bold tracking-tight">{company.name}</span>
          </div>
          <Link
            href={`/${entreprise}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Voir le site
          </Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
