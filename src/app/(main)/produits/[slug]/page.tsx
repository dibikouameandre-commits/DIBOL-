import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Download, FileCheck2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import { ProductThumbnail } from "@/components/product/product-thumbnail";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { getProductBySlug, getRelatedProducts } from "@/server/catalog";
import { AddToCartButton } from "./add-to-cart-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Produit introuvable" };
  }

  const description = product.description.slice(0, 155);

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
    },
  };
}

const trust = [
  { icon: Download, text: "Téléchargement immédiat" },
  { icon: FileCheck2, text: "Licence d'utilisation incluse" },
  { icon: ShieldCheck, text: "Paiement sécurisé Stripe" },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(
    product.categoryId,
    product.id
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.category.name,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/produits/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/boutique" className="hover:text-foreground">
          Boutique
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/boutique?categorie=${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductThumbnail
          categorySlug={product.category.slug}
          className="aspect-square rounded-2xl"
          iconClassName="size-20"
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              {product.category.name}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="text-3xl font-bold tabular-nums">
            {formatPrice(product.price)}
          </div>

          <AddToCartButton
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            categorySlug={product.category.slug}
          />

          <ul className="flex flex-col gap-2.5 border-t pt-5">
            {trust.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <item.icon className="size-4 text-primary" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold tracking-tight">
            Produits similaires
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
