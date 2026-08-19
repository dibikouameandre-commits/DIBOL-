import { prisma } from "@/lib/prisma";

// Mirrors src/server/catalog.ts exactly, with every query additionally
// scoped to a single company — this (not the UI) is the actual isolation
// boundary for the public storefront, same principle as the admin panel.

export async function getCompanyCategories(companyId: string) {
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

function serializeProduct<
  T extends {
    price: { toString(): string };
    category: { id: string; name: string; slug: string };
  },
>(product: T) {
  return { ...product, price: product.price.toString() };
}

export async function getCompanyProducts(
  companyId: string,
  options: { categorySlug?: string; query?: string; take?: number } = {}
) {
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

export async function getCompanyProductBySlug(companyId: string, slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, companyId, isPublished: true },
    include: { category: true },
  });

  return product ? serializeProduct(product) : null;
}

export async function getCompanyRelatedProducts(
  companyId: string,
  categoryId: string,
  excludeId: string
) {
  const products = await prisma.product.findMany({
    where: { companyId, categoryId, isPublished: true, NOT: { id: excludeId } },
    include: { category: true },
    take: 3,
  });

  return products.map(serializeProduct);
}
