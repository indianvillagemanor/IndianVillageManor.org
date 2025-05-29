"use server";

import * as z from "zod";

import { LoginSchema } from "@/schemas";

import { signIn } from "next-auth/react";

const handleLogin = async (email: string) => {
  await signIn("email", { email });
};

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email } = validatedFields.data;

  try {
    await handleLogin(email);
  } catch (err: any) {
    return { error: err.message || "Failed to send magic link." };
  }

  return { success: "requested sending of magic link!" };

}