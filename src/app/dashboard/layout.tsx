import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DashboardNav } from "./dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {session?.user?.name ?? session?.user?.email}
          </h1>
          <p className="text-muted-foreground">
            Gère tes achats et ton profil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/boutique"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Continuer mes achats
          </Link>
          <SignOutButton />
        </div>
      </div>

      <DashboardNav />

      <div className="mt-6">{children}</div>
    </div>
  );
}
