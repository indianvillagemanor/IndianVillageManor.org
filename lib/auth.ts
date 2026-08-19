import { AuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { prisma } from './prisma';
import { sendEmail, replaceTemplateVariables } from './email';
import { useReusableVerificationToken } from './magic-link';
import {
  logLoginAttempt,
  logMagicLinkRequest,
  logSessionCreated,
  checkRateLimit
} from './audit';

// Build providers list dynamically based on available env vars
function buildProviders() {
  const providers = [];

  // Google OAuth (optional - only if credentials configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  // Microsoft / Azure AD OAuth (optional - only if credentials configured)
  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
    providers.push(
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  // Email provider (magic link) - always available
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER || {
        host: process.env.EMAIL_HOST!,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,
      maxAge: parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15') * 60,
      async sendVerificationRequest({ identifier: email, url }) {
        const rateLimitConfig = await prisma.systemConfig.findUnique({
          where: { key: 'rate_limit_magic_link_requests' },
        });
        const maxAttempts = parseInt(rateLimitConfig?.value || '3');
        const rateLimit = await checkRateLimit(email, 'magic-link', maxAttempts, 60);

        if (!rateLimit.allowed) {
          await logMagicLinkRequest(email, false, undefined, undefined, 'rate_limit_exceeded');
          throw new Error(
            `Too many magic link requests. Please try again after ${rateLimit.resetAt.toLocaleTimeString()}`
          );
        }

        const template = await prisma.emailTemplate.findUnique({
          where: { key: 'magic-link' },
        });

        if (!template) {
          throw new Error('Magic link email template not found');
        }

        const expiryMinutes = parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15');
        const expiresIn = `${expiryMinutes} minutes`;

        const emailBody = replaceTemplateVariables(template.body, {
          email,
          link: url,
          expiresIn,
        });

        try {
          await sendEmail({
            to: email,
            subject: template.subject,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'),
          });
          await logMagicLinkRequest(email, true);
        } catch (error) {
          await logMagicLinkRequest(email, false, undefined, undefined, 'email_send_failed');
          throw error;
        }
      },
    })
  );

  return providers;
}

export const authOptions: AuthOptions = {
  adapter: {
    ...PrismaAdapter(prisma),
    // Override the default single-use token deletion so that magic links
    // remain valid for 30 minutes after the first click.  This prevents
    // email-client link-preview requests from permanently invalidating a link
    // before the user has a chance to click it themselves.
    useVerificationToken: useReusableVerificationToken,
  } as Adapter,
  providers: buildProviders(),
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 90 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!dbUser) {
        // For OAuth: user must register first
        if (account?.provider !== 'email') {
          await logLoginAttempt(user.email!, false, undefined, undefined, undefined, `sso_user_not_registered:${account?.provider}`);
          return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/error?error=SSONotRegistered`;
        }
        await logLoginAttempt(user.email!, false, undefined, undefined, undefined, 'user_not_found');
        return false;
      }

      if (dbUser.verificationStatus === 'pending') {
        await logLoginAttempt(user.email!, false, undefined, undefined, dbUser.id, 'pending_verification');
        return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/error?error=PendingVerification`;
      }

      if (dbUser.verificationStatus === 'denied') {
        await logLoginAttempt(user.email!, false, undefined, undefined, dbUser.id, 'verification_denied');
        return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/error?error=VerificationDenied`;
      }

      const provider = account?.provider || 'email';
      await logLoginAttempt(user.email!, true, undefined, undefined, dbUser.id, `provider:${provider}`);
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        await logSessionCreated(user.id, user.email!, undefined, undefined);
      }
      return token;
    },

    async session({ session, token }) {
      const sessionConfig = await prisma.systemConfig.findUnique({
        where: { key: 'session_timeout_days' },
      });
      const sessionTimeoutDays = parseInt(sessionConfig?.value || '90');

      if (token && session.user) {
        session.user.id = token.userId as string;
        session.expires = new Date(Date.now() + sessionTimeoutDays * 24 * 60 * 60 * 1000).toISOString();

        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          include: { roles: true },
        });

        if (dbUser) {
          session.user.verificationStatus = dbUser.verificationStatus;
          session.user.roles = dbUser.roles.map(r => r.name);
          session.user.firstName = dbUser.firstName;
          session.user.lastName = dbUser.lastName;
        }
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.email) {
        const email = token.email as string;
        const userId = token.userId as string;
        logLoginAttempt(email, true, undefined, undefined, userId, 'logout').catch(console.error);
      }
    },
  },
};
