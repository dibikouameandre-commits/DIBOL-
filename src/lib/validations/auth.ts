import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().min(1, "L'email est requis").email("Email invalide"),
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
