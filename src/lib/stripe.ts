import Stripe from "stripe";

// Stripe's SDK throws at construction time if the key is empty, which would
// crash every route/module that imports this file before Stripe keys are
// configured. Fall back to an inert placeholder so the app boots cleanly in
// dev/test — real API calls will then fail gracefully and are caught where
// `stripe` is used (see src/server/checkout.ts).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing_key", {
  apiVersion: "2026-07-29.dahlia",
  typescript: true,
});
