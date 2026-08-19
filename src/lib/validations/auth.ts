import { z } from "zod";

import { normalizeEmail } from "@/lib/utils";

const emailField = z
  .string()
  .min(1, "L'email est requis")
  .transform(normalizeEmail)
  .pipe(z.string().email("Email invalide"));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: emailField,
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const requestPasswordResetSchema = z.object({
  email: emailField,
});

export type RequestPasswordResetValues = z.infer<
  typeof requestPasswordResetSchema
>;

export const resetPasswordSchema = z
  .object({
    email: emailField,
    token: z.string().min(1, "Lien de réinitialisation invalide"),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirme le nouveau mot de passe"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
