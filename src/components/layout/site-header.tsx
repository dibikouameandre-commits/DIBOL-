import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isCompanyAdmin } from "@/lib/roles";
import { siteConfig } from "@/config/site";
import { getCompanySlugById } from "@/server/company";
import { AccountMenu } from "@/components/layout/account-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CartButton } from "@/components/cart/cart-button";

export async function SiteHeader() {
  const session = await auth();
  const companySlug =
    session?.user && isCompanyAdmin(session.user.role) && session.user.companyId
      ? await getCompanySlugById(session.user.companyId)
      : null;

  return (
    <SiteHeaderShell>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <MobileNav isAuthenticated={!!session?.user} />
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight whitespace-nowrap"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              D
            </span>
            {siteConfig.name}
          </Link>
          <nav className="hidden items-center gap-4 md:flex lg:gap-7">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <CartButton />
            <ThemeToggle />
          </div>
          {session?.user ? (
            <AccountMenu user={session.user} companySlug={companySlug} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/connexion"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
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
