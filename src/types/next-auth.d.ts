import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "CLIENT" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "CLIENT" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "CLIENT" | "ADMIN";
  }
}
