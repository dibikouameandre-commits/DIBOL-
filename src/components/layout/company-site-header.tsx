import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isCompanyAdmin } from "@/lib/roles";
import { getCompanySlugById } from "@/server/company";
import { AccountMenu } from "@/components/layout/account-menu";
import { CompanyMobileNav } from "@/components/layout/company-mobile-nav";
import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CompanyCartButton } from "@/components/cart/company-cart-button";

export async function CompanySiteHeader({
  entreprise,
  companyName,
}: {
  entreprise: string;
  companyName: string;
}) {
  const session = await auth();
  const base = `/${entreprise}`;
  // Resolved from the user's own companyId, not from `entreprise` (the
  // storefront currently being browsed) — a COMPANY_ADMIN of company A
  // viewing company B's public storefront must still get a link to their
  // own admin panel, never to B's.
  const companySlug =
    session?.user && isCompanyAdmin(session.user.role) && session.user.companyId
      ? await getCompanySlugById(session.user.companyId)
      : null;

  const nav = [
    { title: "Accueil", href: base },
    { title: "Boutique", href: `${base}/boutique` },
    { title: "Catégories", href: `${base}/categories` },
  ];

  return (
    <SiteHeaderShell>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          <CompanyMobileNav entreprise={entreprise} isAuthenticated={!!session?.user} />
          <Link
            href={base}
            className="shrink-0 text-lg font-bold tracking-tight whitespace-nowrap"
          >
            {companyName}
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <CompanyCartButton entreprise={entreprise} />
            <ThemeToggle />
          </div>
          {session?.user ? (
            <AccountMenu user={session.user} companySlug={companySlug} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href={`${base}/connexion`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Connexion
              </Link>
              <Link
                href={`${base}/inscription`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Créer un compte
              </Link>
            </div>
          )}
        </div>
      </div>
    </SiteHeaderShell>
  );
}
