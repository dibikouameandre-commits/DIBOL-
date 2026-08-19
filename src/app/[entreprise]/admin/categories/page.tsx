import type { Metadata } from "next";
import { Plus, Pencil } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getAllCompanyCategories } from "@/server/company-admin/categories";
import { CompanyCategoryDialog } from "./category-dialog";
import { CompanyCategoryDeleteButton } from "./category-delete-button";

export const metadata: Metadata = { title: "Catégories — Admin entreprise" };

export default async function CompanyCategoriesPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const categories = await getAllCompanyCategories(entreprise);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
          <p className="text-muted-foreground">
            {categories.length} catégorie{categories.length > 1 ? "s" : ""}
          </p>
        </div>
        <CompanyCategoryDialog
          entreprise={entreprise}
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" />
              Nouvelle catégorie
            </Button>
          }
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Aucune catégorie pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell>{category._count.products}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <CompanyCategoryDialog
                        entreprise={entreprise}
                        category={category}
                        trigger={
                          <Button variant="ghost" size="icon-sm">
                            <Pencil />
                            <span className="sr-only">Modifier</span>
                          </Button>
                        }
                      />
                      <CompanyCategoryDeleteButton
                        entreprise={entreprise}
                        id={category.id}
                        name={category.name}
                      />
                    </div>
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
