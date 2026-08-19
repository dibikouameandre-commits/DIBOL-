import type { NextAuthConfig } from "next-auth";

import type { Role } from "@/generated/prisma/enums";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/connexion",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.role = user.role;
        token.tokenVersion = user.tokenVersion;
        token.companyId = user.companyId;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.companyId = token.companyId as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
