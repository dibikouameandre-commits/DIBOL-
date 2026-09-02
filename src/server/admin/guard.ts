import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";

export async function requireSuperAdmin() {
  const session = await auth();

  if (!session?.user) {
    // Not just "never logged in" — this also fires when auth.ts's jwt
    // callback invalidated a stale session (tokenVersion/isActive
    // mismatch). Redirecting through force-signout actually clears the
    // cookie (a Route Handler can; this Server Component can't), which is
    // what stops middleware.ts from reading the same "still valid" cookie
    // and bouncing straight back to /admin.
    redirect("/api/auth/force-signout?from=/admin");
  }

  if (!isSuperAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}

// Used by Phase C's company-scoped admin panel: allows SUPER_ADMIN (any
// company) or a COMPANY_ADMIN whose own companyId matches the requested
// company — this is the guard-fail that prevents one company's admin from
// ever reading or writing another company's data.
export async function requireCompanyAdmin(companySlug: string) {
  const session = await auth();

  if (!session?.user) {
    // Same stale-cookie fix as requireSuperAdmin() above.
    redirect(`/api/auth/force-signout?from=/${companySlug}/admin`);
  }

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
  });

  if (!company) {
    redirect("/dashboard");
  }

  const authorized =
    isSuperAdmin(session.user.role) ||
    (session.user.role === "COMPANY_ADMIN" &&
      session.user.companyId === company.id);

  if (!authorized) {
    redirect("/dashboard");
  }

  return { session, company };
}
