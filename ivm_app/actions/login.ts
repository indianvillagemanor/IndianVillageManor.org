"use server";

import * as z from "zod";

import { LoginSchema } from "@/schemas";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  console.log("Login action called with values:", values);
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  // Only validate fields and return success; do not call signIn here
  return { success: "Fields validated!", email: validatedFields.data.email };
}