import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { AccountMenu } from "@/components/layout/account-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CartButton } from "@/components/cart/cart-button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <MobileNav />
          <Link href="/" className="text-lg font-bold tracking-tight">
            {siteConfig.name}
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {siteConfig.nav.map((item) => (
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

        <div className="flex items-center gap-2">
          <CartButton />
          <ThemeToggle />
          {session?.user ? (
            <AccountMenu user={session.user} />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
