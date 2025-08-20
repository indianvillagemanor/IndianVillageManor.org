import NextAuth, { SessionStrategy } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { LoggerInstance } from "next-auth";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        const { server, from } = provider;
        const transport = nodemailer.createTransport(server);
        try {
          await transport.sendMail({
            to: identifier,
            from,
            subject: "Your sign-in link for IVM App",
            text: `Sign in to IVM App by clicking the link below:\n\n${url}\n\nThis link will expire in 7 days.`,
            html: `<p>Sign in to IVM App by clicking the link below:</p><p><a href="${url}">Sign in</a></p><p>This link will expire in 7 days.</p>`,
          });
        } catch (error) {
          console.error("Error sending verification email:", error);
          throw new Error("Failed to send verification email");
        }
      },
  maxAge: 7 * 24 * 60 * 60, // Magic link valid for 7 days
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify-request",
    // Redirect to homepage after login
    newUser: "/", // after first registration
  },
  callbacks: {
    async signIn(params: {
      user: User | null;
      account: import("next-auth").Account | null;
      profile?: import("next-auth").Profile;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, unknown>;
    }) {
      const userEmail = params.user?.email || (typeof params.email === 'string' ? params.email : undefined);
      if (!userEmail) return false;
      const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
      if (!dbUser) {
        // Not registered: redirect to registration page with email prefilled
        return "/auth/register?email=" + encodeURIComponent(userEmail);
      }
      // Not approved: userVerified is null
      if (!dbUser.userVerified) {
        return "/auth/pending-approval?email=" + encodeURIComponent(userEmail);
      }
      // Allow sign in
      return true;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Redirect to /welcome after login
      if (url.startsWith(baseUrl)) {
        return baseUrl + "/welcome";
      }
      return url;
    },
    async session({ session, /*token, user*/ }: { session: Session; token: JWT; user?: User }) {
      // ...existing code for session customization (if needed)...
      return session;
    },
    // Add other callbacks as needed
  },
  logger: {
    error(code: string, metadata: Error | { [key: string]: unknown; error: Error }) {
      console.error(code, metadata);
    },
    warn(code: string) {
      console.warn(code);
    },
    debug(code: string, metadata?: Record<string, unknown>) {
      console.debug(code, metadata);
    },
  } as LoggerInstance,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };