import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchForm({
  defaultValue,
  categorie,
}: {
  defaultValue?: string;
  categorie?: string;
}) {
  return (
    <form action="/boutique" method="get" className="relative w-full sm:max-w-xs">
      {categorie && (
        <input type="hidden" name="categorie" value={categorie} />
      )}
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        defaultValue={defaultValue}
        placeholder="Rechercher un produit..."
        className="h-9 pl-8"
      />
    </form>
  );
}
