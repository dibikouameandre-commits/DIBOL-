import type { NextAuthConfig } from "next-auth";

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
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "CLIENT" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
