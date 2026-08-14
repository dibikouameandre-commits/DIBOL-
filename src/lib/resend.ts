import { Resend } from "resend";

// Same reasoning as src/lib/stripe.ts: the Resend SDK throws at construction
// time when the key is missing, which would crash every module that imports
// this file before an API key is configured. Fall back to a placeholder so
// the app boots cleanly — sendOrderConfirmationEmail already wraps the
// actual `.send()` call in try/catch and treats email as best-effort.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_key");

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "DIBOL AI <onboarding@resend.dev>";
