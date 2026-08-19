import type { Role } from "@/generated/prisma/enums";

// "ADMIN" is the pre-multi-entreprise role value. It is treated as an
// alias for SUPER_ADMIN until every existing admin account has been
// migrated to the new value and this fallback can be safely removed —
// this avoids any window where deployed code and the database disagree
// on what an admin account looks like.
export function isSuperAdmin(role: Role) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isCompanyAdmin(role: Role) {
  return role === "COMPANY_ADMIN";
}

export function isAnyAdmin(role: Role) {
  return isSuperAdmin(role) || isCompanyAdmin(role);
}
