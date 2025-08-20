import { SessionStrategy } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";


import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";


export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 7 * 24 * 60 * 60, // Magic link valid for 7 days
      async sendVerificationRequest({ identifier, url, provider }) {
        const { server, from } = provider;
        // Use nodemailer to send the custom email
        // Import nodemailer only here to avoid issues in edge runtimes
        const nodemailer = await import("nodemailer");
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
          // Log and rethrow for NextAuth to handle
          console.error("Error sending verification email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  pages: {
    signIn: "/auth/login",
    // You can customize other pages as needed
  },
  callbacks: {
    async signIn({ user }: {
      user: import("next-auth").User | import("@auth/core/adapters").AdapterUser;
    }) {
      const userEmail = user?.email;
      if (!userEmail) return false;
      // Fetch user from DB
      const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
      if (!dbUser) return false;
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
    error(code: string, metadata: Error | { error: Error; [key: string]: unknown }) {
      console.error(code, metadata);
    },
    warn(code: "NEXTAUTH_URL" | "NO_SECRET" | "TWITTER_OAUTH_2_BETA" | "DEBUG_ENABLED") {
      console.warn(code);
    },
    debug(code: string, metadata: unknown) {
      console.debug(code, metadata);
    },
  },
};
