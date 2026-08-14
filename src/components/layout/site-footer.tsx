import Link from "next/link";

import { siteConfig } from "@/config/site";

const footerLinks = [
  {
    title: "Produit",
    links: [
      { title: "Boutique", href: "/boutique" },
      { title: "Catégories", href: "/categories" },
    ],
  },
  {
    title: "Compte",
    links: [
      { title: "Connexion", href: "/connexion" },
      { title: "Créer un compte", href: "/inscription" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold tracking-tight">
            {siteConfig.name}
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>

        {footerLinks.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <span className="text-sm font-medium">{group.title}</span>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
      </div>
    </footer>
  );
}
