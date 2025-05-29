import NextAuth, { SessionStrategy } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: "localhost", // or your Postfix server
        port: 25,          // or 587 if using TLS
        auth: null,        // or { user: "...", pass: "..." } if needed
      },
      from: "no-reply@yourdomain.com", // set to your domain
      maxAge: 24 * 60 * 60, // Magic link valid for 24h
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  pages: {
    signIn: "/auth/login",
    // You can customize other pages as needed
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };