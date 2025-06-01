import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { token, email } = await req.json();
  if (!token || !email) {
    return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });
  }

  // Find the verification token
  const verification = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
  });

  if (!verification || verification.expires < new Date()) {
    if (!verification) {
      console.error(`Verification token not found for email: ${email}`);
    }
    if (verification && verification.expires < new Date()) {
      console.error(`Verification token for email: ${email} has expired.`);
    }
    return NextResponse.json({ error: "Verification link is invalid or has expired." }, { status: 400 });
  }

  // Mark user as verified
  console.log(`Entering emailVerified into db for: ${email}`);
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  // Delete the verification token
  console.log(`Deleting verification token for email: ${email}`);
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
  });

  return NextResponse.json({ success: "Your email has been verified! You may now log in." });
}
