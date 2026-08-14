import { prisma } from "@/lib/prisma";

export async function getCategories() {
  const categories = await prisma.category.findMany({
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
  return prisma.category.findUnique({ where: { slug } });
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
  const { categorySlug, query, take } = options;

  const products = await prisma.product.findMany({
    where: {
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
  const product = await prisma.product.findFirst({
    where: { slug, isPublished: true },
    include: { category: true },
  });

  return product ? serializeProduct(product) : null;
}

export async function getRelatedProducts(categoryId: string, excludeId: string) {
  const products = await prisma.product.findMany({
    where: { categoryId, isPublished: true, NOT: { id: excludeId } },
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
