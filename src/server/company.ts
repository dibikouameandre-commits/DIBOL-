import { prisma } from "@/lib/prisma";

// Public, unauthenticated lookup — used by the storefront layout to resolve
// which company a `/[entreprise]/...` request belongs to. Unlike
// requireCompanyAdmin (src/server/admin/guard.ts), this never checks a
// session — the public storefront must be browsable while logged out.
export async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({ where: { slug } });
}

// Resolves a COMPANY_ADMIN's own admin-panel link server-side, from the
// company they are actually attached to (session.user.companyId, itself
// DB-revalidated on every request — see src/lib/auth.ts). Callers must
// never substitute a slug taken from the current page/URL instead.
export async function getCompanySlugById(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { slug: true },
  });
  return company?.slug ?? null;
}

// The global super-admin panel (/admin/produits, /admin/categories) creates
// resources that must land in "Entreprise par défaut" — matching what the
// global, un-prefixed storefront (src/server/catalog.ts) actually shows.
// Without this, a new product/category gets companyId: null and becomes
// invisible on the public site while still appearing in the admin's own
// list.
export async function getDefaultCompanyId() {
  const company = await getCompanyBySlug("default");
  return company?.id ?? null;
}
