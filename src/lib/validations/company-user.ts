import { z } from "zod";

import { normalizeEmail } from "@/lib/utils";

// A COMPANY_ADMIN may only ever create/edit CLIENT or COMPANY_ADMIN users
// within their own company — SUPER_ADMIN/ADMIN can never pass this schema,
// which is the actual enforcement point, not just a UI restriction.
export const companyUserRoleSchema = z.enum(["CLIENT", "COMPANY_ADMIN"]);

export const createCompanyUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Email invalide")
    .transform(normalizeEmail),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: companyUserRoleSchema,
});

export type CreateCompanyUserValues = z.infer<typeof createCompanyUserSchema>;

export const updateCompanyUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: companyUserRoleSchema,
});

export type UpdateCompanyUserValues = z.infer<typeof updateCompanyUserSchema>;
