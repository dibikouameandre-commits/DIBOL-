import type { NextConfig } from "next";

// Adapted to what this app actually loads (verified before writing this):
// - No third-party script origins anywhere (no analytics, no embedded
//   Stripe.js — checkout is a server-side redirect to Stripe's own hosted
//   page via `redirect(checkoutSession.url)`, never an in-page script).
// - Fonts are self-hosted by next/font (Geist/Geist Mono downloaded at
//   build time), so no fonts.googleapis.com/gstatic.com is needed.
// - `next/image` is never used and no product images are rendered yet
//   (img-src only needs 'self' plus data: for the CV photo/invoice logo
//   previews, which are data URIs by design — see compress-image.ts).
// script-src keeps 'unsafe-inline': Next's own RSC hydration payload and
// next-themes' flash-prevention script are both inline and unnoncable
// without a bigger, riskier middleware rewrite than this pass calls for.
// The JSON-LD XSS fix (safeJsonLd in src/lib/json-ld.ts) is the actual
// mitigation for script injection via that vector; this CSP is defense in
// depth on top of it — most usefully connect-src/form-action/frame-ancestors,
// which still hold even with 'unsafe-inline' on scripts.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
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
