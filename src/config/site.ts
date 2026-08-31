export const siteConfig = {
  name: "DIBOL AI",
  description:
    "DIBOL AI — la plateforme SaaS pour acheter et vendre des produits digitaux propulsés par l'IA.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nav: [
    { title: "Accueil", href: "/" },
    { title: "Outils IA", href: "/outils" },
    { title: "Boutique", href: "/boutique" },
    { title: "Catégories", href: "/categories" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
