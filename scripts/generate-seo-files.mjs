// Generates public/sitemap.xml and public/robots.txt at build time.
//
// This deliberately avoids Next.js's app/sitemap.ts and app/robots.ts file
// conventions: on this machine (and any Windows machine whose username
// contains an apostrophe), those go through a webpack loader
// (next-metadata-route-loader) that embeds the absolute file path in a
// single-quoted JS string without escaping it, which breaks the build with
// "Unexpected token" the moment the path contains a `'`. Static files in
// public/ sidestep that loader entirely (same fix as favicon.ico earlier).
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

if (existsSync(".env")) {
  const dotenv = await import("dotenv");
  dotenv.config();
}

const { neon } = await import("@neondatabase/serverless");

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const sql = neon(process.env.DATABASE_URL);

// The global, un-prefixed public routes (/produits/[slug], /boutique) only
// ever show "Entreprise par défaut" (see src/server/catalog.ts) — the
// sitemap must match exactly, or it advertises URLs from other companies
// that 404 on the real site.
const [defaultCompany] = await sql`SELECT id FROM "Company" WHERE slug = 'default'`;
const defaultCompanyId = defaultCompany?.id ?? null;

const products = defaultCompanyId
  ? await sql`SELECT slug FROM "Product" WHERE "isPublished" = true AND "companyId" = ${defaultCompanyId}`
  : [];
const categories = defaultCompanyId
  ? await sql`SELECT slug FROM "Category" WHERE "companyId" = ${defaultCompanyId}`
  : [];

// Mirrors the 14 slugs in src/lib/tools/registry.ts — duplicated here rather
// than imported, since this script runs via plain `node` (no TS loader) at
// build time. Only the tool's own page belongs in the sitemap: resultat/
// and historique/ pages are all `robots: { index: false }` on purpose.
const TOOL_SLUGS = [
  "generateur-cv",
  "lettre-motivation",
  "facture-devis",
  "email-professionnel",
  "lettre-administrative",
  "posts-reseaux-sociaux",
  "prompts-ia",
  "nom-entreprise-slogan",
  "business-plan",
  "resume-document",
  "script-video",
  "calcul-prix-vente",
  "contrat-simple",
  "workflow-n8n",
];

const staticRoutes = [
  "",
  "/boutique",
  "/categories",
  "/connexion",
  "/inscription",
  "/outils",
  ...TOOL_SLUGS.map((slug) => `/outils/${slug}`),
];

const urls = [
  ...staticRoutes.map((route) => `${siteUrl}${route}`),
  ...products.map((p) => `${siteUrl}/produits/${p.slug}`),
  ...categories.map((c) => `${siteUrl}/boutique?categorie=${c.slug}`),
];

const lastmod = new Date().toISOString();

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`).join("\n")}
</urlset>
`;

const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /api

Sitemap: ${siteUrl}/sitemap.xml
`;

const publicDir = path.join(process.cwd(), "public");
await writeFile(path.join(publicDir, "sitemap.xml"), sitemapXml);
await writeFile(path.join(publicDir, "robots.txt"), robotsTxt);

console.log(`Generated sitemap.xml (${urls.length} urls) and robots.txt in public/`);
