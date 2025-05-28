import crypto from "crypto";
import { prisma } from "@/lib/db";
import { UserNotFoundError } from "@/lib/errors";

// You can replace this with your actual email sending logic
async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  // TODO: Implement email sending (e.g., using Nodemailer)
  console.log(`Sending email to ${to}: ${subject} - ${text}`);
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function sendMagicLink(email: string) {
  // Generate a secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = minutesFromNow(15);

  // Find the user by email
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UserNotFoundError(email);
    }

    // Store the token in the database
    await prisma.magicLinkToken.create({
      data: {
        userId: email, // userId references User.email
        token,
        expiresAt,
      },
    });

    // Prepare the magic link
    const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/magic?token=${token}`;

    // Send the email (replace with your actual logic)
    await sendEmail({
      to: email,
      subject: "Your Magic Login Link",
      text: `Click here to login: ${magicLink}`,
    });
  } catch (err: any) {
    throw new Error(`Software error, contact the office for help.  Details: ${err.message || " database operation failed"}`);
  }
}
