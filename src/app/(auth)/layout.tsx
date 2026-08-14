import Link from "next/link";

import { siteConfig } from "@/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Link href="/" className="text-2xl font-bold tracking-tight">
        {siteConfig.name}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
