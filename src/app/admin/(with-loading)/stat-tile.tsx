import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
