import { prisma } from "@/lib/prisma";
import { getCompanyBySlug } from "@/server/company";

// The global, un-prefixed storefront (`/`, `/boutique`, `/categories`,
// `/produits/[slug]`) represents "Entreprise par défaut" specifically — not
// every company's catalog combined. This keeps every existing URL working
// exactly as before (same data as `/default/boutique`) while fixing the
// cross-company mixing that existed before company-scoped routes existed.
async function getDefaultCompanyId() {
  const company = await getCompanyBySlug("default");
  return company?.id ?? null;
}

export async function getCategories() {
  const companyId = await getDefaultCompanyId();
  if (!companyId) return [];

  const categories = await prisma.category.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    productCount: category._count.products,
  }));
}

export async function getCategoryBySlug(slug: string) {
  const companyId = await getDefaultCompanyId();
  if (!companyId) return null;
  return prisma.category.findFirst({ where: { slug, companyId } });
}

function serializeProduct<
  T extends {
    price: { toString(): string };
    category: { id: string; name: string; slug: string };
  },
>(product: T) {
  return { ...product, price: product.price.toString() };
}

export async function getProducts(
  options: { categorySlug?: string; query?: string; take?: number } = {}
) {
  const companyId = await getDefaultCompanyId();
  if (!companyId) return [];

  const { categorySlug, query, take } = options;

  const products = await prisma.product.findMany({
    where: {
      companyId,
      isPublished: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(query
        ? { name: { contains: query, mode: "insensitive" as const } }
        : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
  });

  return products.map(serializeProduct);
}

export async function getProductBySlug(slug: string) {
  const companyId = await getDefaultCompanyId();
  if (!companyId) return null;

  const product = await prisma.product.findFirst({
    where: { slug, companyId, isPublished: true },
    include: { category: true },
  });

  return product ? serializeProduct(product) : null;
}

export async function getRelatedProducts(categoryId: string, excludeId: string) {
  const companyId = await getDefaultCompanyId();
  if (!companyId) return [];

  const products = await prisma.product.findMany({
    where: { companyId, categoryId, isPublished: true, NOT: { id: excludeId } },
    include: { category: true },
    take: 3,
  });

  return products.map(serializeProduct);
}

export async function getProductSlugs() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });

  return products.map((p) => p.slug);
}

export async function getCategorySlugs() {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  return categories.map((c) => c.slug);
}
