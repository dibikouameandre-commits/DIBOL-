import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)"),
  description: z.string().optional(),
});

export type CategoryValues = z.infer<typeof categorySchema>;
