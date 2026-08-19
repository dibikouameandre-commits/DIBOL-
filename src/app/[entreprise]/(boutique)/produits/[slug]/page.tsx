import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Download, FileCheck2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import { ProductThumbnail } from "@/components/product/product-thumbnail";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { getCompanyBySlug } from "@/server/company";
import { getCompanyProductBySlug, getCompanyRelatedProducts } from "@/server/company-catalog";
import { CompanyAddToCartButton } from "./add-to-cart-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entreprise: string; slug: string }>;
}): Promise<Metadata> {
  const { entreprise, slug } = await params;
  const company = await getCompanyBySlug(entreprise);
  const product = company ? await getCompanyProductBySlug(company.id, slug) : null;

  if (!product) {
    return { title: "Produit introuvable" };
  }

  const description = product.description.slice(0, 155);

  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, type: "website" },
  };
}

const trust = [
  { icon: Download, text: "Téléchargement immédiat" },
  { icon: FileCheck2, text: "Licence d'utilisation incluse" },
  { icon: ShieldCheck, text: "Paiement sécurisé Stripe" },
];

export default async function CompanyProductPage({
  params,
}: {
  params: Promise<{ entreprise: string; slug: string }>;
}) {
  const { entreprise, slug } = await params;
  const company = await getCompanyBySlug(entreprise);

  if (!company) {
    notFound();
  }

  const product = await getCompanyProductBySlug(company.id, slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getCompanyRelatedProducts(
    company.id,
    product.categoryId,
    product.id
  );

  const base = `/${entreprise}`;

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
      url: `${siteConfig.url}${base}/produits/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href={`${base}/boutique`} className="hover:text-foreground">
          Boutique
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`${base}/boutique?categorie=${product.category.slug}`}
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
          iconClassName="size-16"
          iconWrapperClassName="size-32"
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

          <CompanyAddToCartButton
            entreprise={entreprise}
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
              <ProductCard key={related.id} product={related} basePath={base} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
