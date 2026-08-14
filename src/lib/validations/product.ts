import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)"),
  description: z.string().min(10, "La description doit être plus détaillée"),
  price: z.coerce.number().positive("Le prix doit être positif"),
  categoryId: z.string().min(1, "Sélectionne une catégorie"),
  isPublished: z.coerce.boolean(),
});

export type ProductValues = z.infer<typeof productSchema>;
