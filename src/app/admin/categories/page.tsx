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
import { getAllCategories } from "@/server/admin/categories";
import { CategoryDialog } from "./category-dialog";
import { CategoryDeleteButton } from "./category-delete-button";

export const metadata: Metadata = { title: "Catégories — Admin" };

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
          <p className="text-muted-foreground">
            {categories.length} catégorie{categories.length > 1 ? "s" : ""}
          </p>
        </div>
        <CategoryDialog
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
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {category.slug}
                </TableCell>
                <TableCell>{category._count.products}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <CategoryDialog
                      category={category}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil />
                          <span className="sr-only">Modifier</span>
                        </Button>
                      }
                    />
                    <CategoryDeleteButton id={category.id} name={category.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
