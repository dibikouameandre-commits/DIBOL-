import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "./admin-nav";
import { MobileAdminNav } from "./mobile-admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r bg-muted/20 p-4 lg:flex">
        <Link href="/" className="px-2 text-lg font-bold tracking-tight">
          {siteConfig.name}
        </Link>
        <AdminNav />
        <div className="mt-auto flex flex-col gap-2 px-2">
          <span className="truncate text-xs text-muted-foreground">
            {session?.user?.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <MobileAdminNav />
            <span className="font-bold tracking-tight">Administration</span>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Voir le site
          </Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
