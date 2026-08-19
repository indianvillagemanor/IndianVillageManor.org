import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

/**
 * How long a magic link remains usable after the first click.
 *
 * Email clients and mobile apps frequently "preview" links by fetching them
 * silently (e.g. when the user long-presses a link). The default NextAuth
 * behaviour deletes the VerificationToken on the very first request, so the
 * preview consumes the token before the real click arrives.
 *
 * By extending the token's expiry to this window on every valid use we allow
 * the same link to work repeatedly until the window closes — matching the
 * requirement of "up to 30 minutes after the first time they are clicked".
 */
export const MAGIC_LINK_REUSE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Custom NextAuth adapter callback that replaces the default one-time-use
 * token deletion.
 *
 * Instead of deleting the VerificationToken on first use, this function
 * extends its expiry to MAGIC_LINK_REUSE_WINDOW_MS from now so that the link
 * continues to work within the reuse window (e.g. after an email-preview
 * request has already "consumed" a single-use token).
 *
 * Drop-in replacement for `Adapter.useVerificationToken`.
 */
export async function useReusableVerificationToken({
  token,
}: {
  identifier: string;
  token: string;
}): Promise<{ identifier: string; token: string; expires: Date } | null> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) return null;

  // Token is expired — clean it up so it does not accumulate indefinitely,
  // then return the stale record so NextAuth can produce the correct error.
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return record;
  }

  // Token is valid — extend expiry so the same link can be clicked again
  // within the reuse window (handles preview-then-click sequences).
  const reusableUntil = new Date(Date.now() + MAGIC_LINK_REUSE_WINDOW_MS);
  return prisma.verificationToken.update({
    where: { token },
    data: { expires: reusableUntil },
  });
}

/**
 * Generate a NextAuth-compatible magic link for a given email.
 *
 * The token is stored in the VerificationToken table with the same hashing
 * algorithm NextAuth uses (SHA-256 of rawToken + NEXTAUTH_SECRET). When the
 * recipient clicks the link, NextAuth's email callback handler finds the record,
 * validates it, and — via useReusableVerificationToken — extends the expiry
 * instead of deleting it, allowing the link to be clicked again within the
 * reuse window.
 *
 * @param email       The email address to authenticate
 * @param callbackUrl Where NextAuth should redirect after sign-in
 * @returns           The full magic link URL to embed in an email
 */
export async function createMagicLink(email: string, callbackUrl: string): Promise<string> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const secret = process.env.NEXTAUTH_SECRET!;
  const expiryMinutes = parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15');

  // Generate a random token (same approach NextAuth uses)
  const rawToken = randomBytes(32).toString('hex');

  // Hash the token the same way NextAuth does: SHA-256(rawToken + secret)
  const hashedToken = createHash('sha256').update(`${rawToken}${secret}`).digest('hex');

  const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Store the hashed token in the VerificationToken table
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  // Build the callback URL — NextAuth reads token + email from query params
  const params = new URLSearchParams({
    callbackUrl,
    token: rawToken,
    email,
  });

  return `${baseUrl}/api/auth/callback/email?${params}`;
}
