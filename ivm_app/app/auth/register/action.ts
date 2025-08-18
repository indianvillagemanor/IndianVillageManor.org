"use server";

import crypto from "crypto";
import nodemailer from "nodemailer";
import { RegisterSchema } from "@/schemas";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function register(formData: FormData) {
  const values = {
    name: formData.get("name")?.toString() || "",
    unit: formData.get("unit")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
  };
  const validatedFields = RegisterSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }
  const existingUser = await prisma.user.findUnique({
    where: { email: values.email },
  });
  if (existingUser) {
    return { error: "User already exists" };
  }
  console.log("app/auth/register Creating user with values", values);
  await prisma.user.create({
    data: {
      email: values.email,
      name: values.name,
      unit: values.unit,
      phone: values.phone,
    },
  });
  // Notify all admins
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const adminToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.verificationToken.create({
      data: { identifier: values.email, token: adminToken, expires },
    });
    const verifyUrl = `${baseUrl}/api/admin/verify-registration?token=${adminToken}&email=${encodeURIComponent(values.email)}`;
    const denyUrl = `${baseUrl}/api/admin/deny-registration?token=${adminToken}&email=${encodeURIComponent(values.email)}`;
    const transport = nodemailer.createTransport(process.env.EMAIL_SERVER!);
    const recipients = [...admins.map(a => a.email), "verify@indianvillagemanor.org"];
    console.log("Sending admin registration email to:", recipients);
    await transport.sendMail({
      to: recipients.join(","),
      from: process.env.EMAIL_FROM,
      subject: `New IVM Registration: ${values.name || values.email}`,
  text: `A new user has requested registration.\n\nName: ${values.name}\nEmail: ${values.email}\nUnit: ${values.unit}\nPhone: ${values.phone}\n\nApprove: ${verifyUrl}\nDeny: ${denyUrl}`,
  html: `<p>A new user has requested registration:</p><ul><li>Name: ${values.name}</li><li>Email: ${values.email}</li><li>Unit: ${values.unit}</li><li>Phone: ${values.phone}</li></ul><p><a href=\"${verifyUrl}\">Approve Registration</a> | <a href=\"${denyUrl}\">Deny Registration</a></p>`
    });
  } catch (e) {
    console.error("Failed to notify admins:", e);
  }
  revalidatePath("/");
  return { success: "Registration successful! Please check your email to verify your account." };
}
