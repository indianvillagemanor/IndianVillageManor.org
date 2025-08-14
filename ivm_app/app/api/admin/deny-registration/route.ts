import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  if (!token || !email) {
    return NextResponse.json({ error: "Invalid denial link." }, { status: 400 });
  }
  // Check token
  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });
  if (!verification || verification.expires < new Date()) {
    return NextResponse.json({ error: "Denial link is invalid or has expired." }, { status: 400 });
  }
  // Optionally, delete or disable the user here
  // Send denial email
  try {
    const transport = nodemailer.createTransport(process.env.EMAIL_SERVER!);
    await transport.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Registration could not be verified",
      text: `We could not verify your status. Please contact the association if you believe this is in error.`,
      html: `<p>We could not verify your status. Please contact the association if you believe this is in error.</p>`
    });
  } catch (e) {
    console.error("Failed to send denial email:", e);
  }
  // Delete the verification token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });
  return NextResponse.json({ success: "User denied and notified." });
}
