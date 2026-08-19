import Link from "next/link";

export function CompanySiteFooter({
  entreprise,
  companyName,
}: {
  entreprise: string;
  companyName: string;
}) {
  const base = `/${entreprise}`;

  const footerLinks = [
    {
      title: "Produit",
      links: [
        { title: "Boutique", href: `${base}/boutique` },
        { title: "Catégories", href: `${base}/categories` },
      ],
    },
    {
      title: "Compte",
      links: [
        { title: "Connexion", href: `${base}/connexion` },
        { title: "Créer un compte", href: `${base}/inscription` },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t bg-muted/30">
      <div className="absolute inset-0 -z-10 bg-grid-fade opacity-40" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <span className="text-xl font-bold tracking-tight">{companyName}</span>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Propulsé par DIBOL AI.
          </p>
        </div>

        {footerLinks.map((group) => (
          <div key={group.title} className="flex flex-col gap-4">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
              {group.title}
            </span>
            <ul className="flex flex-col gap-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block text-sm text-muted-foreground transition-all duration-200 hover:translate-x-0.5 hover:text-foreground"
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
        © {new Date().getFullYear()} {companyName}. Tous droits réservés.
      </div>
    </footer>
  );
}
