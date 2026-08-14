"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminNav } from "./admin-nav";

export function MobileAdminNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="lg:hidden" />}
      >
        <Menu />
        <span className="sr-only">Ouvrir le menu admin</span>
      </SheetTrigger>
      <SheetContent side="left" className="p-4">
        <SheetHeader className="p-0">
          <SheetTitle>Administration</SheetTitle>
        </SheetHeader>
        <div onClick={() => setOpen(false)}>
          <AdminNav />
        </div>
      </SheetContent>
    </Sheet>
  );
}
