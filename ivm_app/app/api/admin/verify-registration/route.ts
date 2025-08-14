import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  if (!token || !email) {
    return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });
  }
  // Check token
  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });
  if (!verification || verification.expires < new Date()) {
    return NextResponse.json({ error: "Verification link is invalid or has expired." }, { status: 400 });
  }
  // Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { userVerified: new Date() },
  });
  // Delete the verification token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });
  // Send congratulations + magic link email
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const magicLink = `${baseUrl}/auth/login?email=${encodeURIComponent(email)}`;
    const transport = nodemailer.createTransport(process.env.EMAIL_SERVER!);
    await transport.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Your registration is approved!",
      text: `Congratulations! Your registration has been approved. You may now log in using this link: ${magicLink}`,
      html: `<p>Congratulations! Your registration has been approved.</p><p><a href="${magicLink}">Log in to Indian Village Manor</a></p>`
    });
  } catch (e) {
    console.error("Failed to send approval email:", e);
  }
  return NextResponse.json({ success: "User verified and notified." });
}
