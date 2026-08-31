import { z } from "zod";

// Every real top-level static route segment in src/app (admin, api,
// dashboard, the (auth) and (main) route groups' pages), plus a couple of
// common near-misses (connection, login, signup) — a company using one of
// these as its slug would have parts of its own storefront/admin shadowed
// by the matching static route, since Next.js always prefers a static
// segment over the dynamic [entreprise] one.
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "dashboard",
  "connexion",
  "connection",
  "login",
  "signup",
  "inscription",
  "mot-de-passe-oublie",
  "reinitialiser-mot-de-passe",
  "verifier-email",
  "boutique",
  "categories",
  "panier",
  "commande",
  "produits",
  "outils",
]);

export const companySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)")
    .refine((slug) => !RESERVED_SLUGS.has(slug), {
      message: "Ce slug est réservé par l'application et ne peut pas être utilisé.",
    }),
});

export type CompanyValues = z.infer<typeof companySchema>;
