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

const products = await sql`SELECT slug FROM "Product" WHERE "isPublished" = true`;
const categories = await sql`SELECT slug FROM "Category"`;

const staticRoutes = ["", "/boutique", "/categories", "/connexion", "/inscription"];

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
