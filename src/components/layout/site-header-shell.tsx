"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function SiteHeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md transition-all duration-200",
        scrolled
          ? "border-border shadow-sm"
          : "border-transparent shadow-none"
      )}
    >
      {children}
    </header>
  );
}
