import OpenAI from "openai";

// Same reasoning as src/lib/stripe.ts and src/lib/resend.ts: the SDK throws
// at construction time when the key is missing, which would crash every
// module that imports this file before OPENAI_API_KEY is configured. Fall
// back to an inert placeholder so the app boots cleanly — real calls then
// fail normally and are caught where they're actually invoked (each tool's
// server function).
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-missing-key",
});

// Centralizing the model name here means every tool upgrades together —
// change it once, not once per tool.
export const AI_MODEL = "gpt-4o-mini";
