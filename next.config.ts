import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Disable the client Router Cache for dynamically-rendered pages so
    // admin pages (product/category lists and forms) never show stale
    // data after a mutation made from another page/tab.
    staleTimes: {
      dynamic: 0,
    },
  },
  // pdfkit (used by @react-pdf/renderer, all PDF exports: CV, lettre,
  // facture/devis, lettre administrative, contrat, business plan) loads its
  // standard font files at runtime via Node's package.json "imports" map
  // (require("#standard-fonts/Helvetica") -> ./js/standard-fonts/*.cjs).
  // Next's serverless file tracer doesn't resolve that subpath-import
  // indirection, so those files are silently dropped from the Vercel
  // function bundle, crashing every PDF route in production with
  // "Cannot find module '.../pdfkit/js/standard-fonts/Helvetica.cjs'"
  // (never reproduces locally, since `next dev`/`next start` read straight
  // from node_modules). Declared for every route since every PDF tool hits
  // this identically.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfkit/js/standard-fonts/**"],
  },
};

export default nextConfig;
