"use server";

import * as z from "zod";

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

  revalidatePath("/");

  return { success: "Fields validated!" };

}