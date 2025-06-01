"use server";

import * as z from "zod";
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

  // Send congratulatory email
  try {
    const transport = nodemailer.createTransport(process.env.EMAIL_SERVER!);
    const mailOptions = {
      to: values.email,
      from: process.env.EMAIL_FROM,
      subject: "Welcome to Indian Village Manor!",
      text: `Congratulations, ${values.name || "Resident"}!\n\nYour registration at Indian Village Manor is complete. We are excited to have you as part of our community.\n\nIf you have any questions, feel free to reply to this email.`,
      html: `<p>Congratulations, <strong>${values.name || "Resident"}</strong>!</p><p>Your registration at <strong>Indian Village Manor</strong> is complete. We are excited to have you as part of our community.</p><p>If you have any questions, feel free to reply to this email.</p>`,
    }
    console.log("Sending congratulatory email with:", mailOptions);
    await transport.sendMail(mailOptions);
  } catch (e) {
    console.error("Failed to send congratulatory email:", e);
  }

  revalidatePath("/");

  return { success: "Fields validated!" };

}