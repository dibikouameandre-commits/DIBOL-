import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { normalizeEmail } from "@/lib/utils";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: normalizeEmail(credentials.email as string) },
        });

        if (!user?.password) return null;
        if (!user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          tokenVersion: user.tokenVersion,
          companyId: user.companyId,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async (params) => {
      const token = await authConfig.callbacks!.jwt!(params);
      if (!token) return null;

      // Re-validate against the database on every request in this full
      // (Node) auth context — skipped in middleware's Edge runtime, which
      // has no Prisma access. This makes a role change or password reset
      // take effect immediately instead of waiting for the JWT to expire.
      if (!params.user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, tokenVersion: true, companyId: true, isActive: true },
        });

        if (!dbUser || dbUser.tokenVersion !== token.tokenVersion || !dbUser.isActive) {
          return null;
        }

        token.role = dbUser.role;
        token.companyId = dbUser.companyId;
      }

      return token;
    },
  },
});
