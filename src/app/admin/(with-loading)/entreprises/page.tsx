import type { Metadata } from "next";
import Link from "next/link";
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
import { getAllCompanies } from "@/server/admin/companies";
import { CompanyDialog } from "./company-dialog";
import { CompanyDeleteButton } from "./company-delete-button";

export const metadata: Metadata = { title: "Entreprises — Admin" };

export default async function AdminCompaniesPage() {
  const companies = await getAllCompanies();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entreprises</h1>
          <p className="text-muted-foreground">
            {companies.length} entreprise{companies.length > 1 ? "s" : ""}
          </p>
        </div>
        <CompanyDialog
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" />
              Nouvelle entreprise
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
              <TableHead>Utilisateurs</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Catégories</TableHead>
              <TableHead>Commandes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/${company.slug}/admin`}
                    className="hover:text-primary hover:underline"
                  >
                    {company.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.slug}
                </TableCell>
                <TableCell>{company._count.users}</TableCell>
                <TableCell>{company._count.products}</TableCell>
                <TableCell>{company._count.categories}</TableCell>
                <TableCell>{company._count.orders}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <CompanyDialog
                      company={company}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil />
                          <span className="sr-only">Modifier</span>
                        </Button>
                      }
                    />
                    <CompanyDeleteButton id={company.id} name={company.name} />
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
