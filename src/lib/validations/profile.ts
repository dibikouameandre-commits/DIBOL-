import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirme le nouveau mot de passe"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
