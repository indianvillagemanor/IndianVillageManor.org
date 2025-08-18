import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  if (!token || !email) {
    return NextResponse.redirect(`${baseUrl}/admin/deny-registration-result?error=Invalid%20denial%20link.`);
  }
  // Check token
  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });
  if (!verification || verification.expires < new Date()) {
    return NextResponse.redirect(`${baseUrl}/admin/deny-registration-result?error=Denial%20link%20is%20invalid%20or%20has%20expired.`);
  }
  // Optionally, delete or disable the user here
  // Send denial email
  try {
    const transport = nodemailer.createTransport(process.env.EMAIL_SERVER!);
    await transport.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Registration could not be verified",
      text: `We could not verify your registration. If you believe this is in error, please contact the association for assistance.`,
      html: `<p>We could not verify your registration. If you believe this is in error, please contact the association for assistance.</p>`
    });
  } catch (e) {
    console.error("Failed to send denial email:", e);
  }
  // Delete the verification token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });
  return NextResponse.redirect(`${baseUrl}/admin/deny-registration-result?success=User%20denied%20and%20notified.`);
}
