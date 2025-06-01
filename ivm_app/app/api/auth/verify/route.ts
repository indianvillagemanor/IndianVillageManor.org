import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");
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
    return NextResponse.json({ error: "Verification link is invalid or has expired." }, { status: 400 });
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  // Delete the verification token
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
