import Link from "next/link";
import {
  ArrowRight,
  Download,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CategoryCard } from "@/components/category/category-card";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getProducts } from "@/server/catalog";

export const revalidate = 3600;

const features = [
  {
    icon: Zap,
    title: "Téléchargement instantané",
    description:
      "Accède à tes produits immédiatement après ton paiement, sans attendre.",
  },
  {
    icon: Sparkles,
    title: "Sélection propulsée par l'IA",
    description:
      "Des produits pensés et testés pour accélérer tes automatisations.",
  },
  {
    icon: ShieldCheck,
    title: "Paiement sécurisé",
    description: "Transactions chiffrées et gérées par Stripe.",
  },
  {
    icon: Download,
    title: "Accès à vie",
    description: "Retrouve tous tes achats depuis ton dashboard, à tout moment.",
  },
];

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getProducts({ take: 4 }),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-grid-fade" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6 sm:py-32">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Produits digitaux propulsés par l&apos;IA
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Automatise ton business avec des produits{" "}
            <span className="text-gradient-brand">prêts à l&apos;emploi</span>
          </h1>
          <p className="max-w-xl text-balance text-lg text-muted-foreground">
            Workflows n8n, prompts IA et formations conçus pour te faire gagner
            du temps dès aujourd&apos;hui.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/boutique"
              className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}
            >
              Explorer la boutique
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/categories"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Voir les catégories
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-xl border bg-card p-5"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-4.5" />
              </div>
              <h3 className="font-heading font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Catégories populaires
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Trouve rapidement ce qu&apos;il te faut.
                </p>
              </div>
              <Link
                href="/categories"
                className="hidden text-sm font-medium text-primary sm:block"
              >
                Tout voir →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  slug={category.slug}
                  name={category.name}
                  description={category.description}
                  productCount={category.productCount}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Nouveautés
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Les derniers produits ajoutés à la boutique.
                </p>
              </div>
              <Link
                href="/boutique"
                className="hidden text-sm font-medium text-primary sm:block"
              >
                Tout voir →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Prêt à automatiser ton business ?
            </h2>
            <p className="max-w-md text-primary-foreground/80">
              Crée ton compte gratuitement et accède à toute la boutique.
            </p>
            <Link
              href="/inscription"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "mt-2"
              )}
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
