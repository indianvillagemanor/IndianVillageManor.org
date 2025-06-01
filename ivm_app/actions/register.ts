"use server";

import * as z from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { RegisterSchema } from "@/schemas";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: values.email,
    },
  });

  if (existingUser) {
    return { error: "User already exists" };
  }

  console.log("Creating user with values", values);

  await prisma.user.create({
    data: {
      email: values.email,
      name: values.name,
      unit: values.unit,
      phone: values.phone,
    },
  });

  // Generate a verification token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now
  await prisma.verificationToken.create({
    data: {
      identifier: values.email,
      token,
      expires,
    },
  });

  // Send verification email
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(values.email)}`;
    const transport = nodemailer.createTransport(process.env.EMAIL_SERVER!);
    await transport.sendMail({
      to: values.email,
      from: process.env.EMAIL_FROM,
      subject: "Verify your email for Indian Village Manor",
      text: `Welcome to Indian Village Manor! Please verify your email by clicking the link below (valid for 24 hours):\n\n${verifyUrl}`,
      html: `<p>Welcome to Indian Village Manor!</p><p>Please verify your email by clicking the link below (valid for 24 hours):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    });
  } catch (e) {
    console.error("Failed to send verification email:", e);
  }

  revalidatePath("/");

  return { success: "Registration successful! Please check your email to verify your account." };

}