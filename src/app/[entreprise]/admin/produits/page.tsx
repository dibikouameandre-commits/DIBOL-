import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { getAllCompanyProducts } from "@/server/company-admin/products";
import { CompanyProductRowActions } from "./product-row-actions";

export const metadata: Metadata = { title: "Produits — Admin entreprise" };

export default async function CompanyProductsPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const products = await getAllCompanyProducts(entreprise);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground">
            {products.length} produit{products.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/${entreprise}/admin/produits/nouveau`}
          className={cn(buttonVariants(), "gap-1.5")}
        >
          <Plus className="size-4" />
          Nouveau produit
        </Link>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucun produit pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      href={`/${entreprise}/admin/produits/${product.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category.name}
                  </TableCell>
                  <TableCell>{formatPrice(product.price.toString())}</TableCell>
                  <TableCell>
                    <Badge variant={product.isPublished ? "default" : "outline"}>
                      {product.isPublished ? "Publié" : "Brouillon"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CompanyProductRowActions
                      entreprise={entreprise}
                      id={product.id}
                      name={product.name}
                      isPublished={product.isPublished}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
