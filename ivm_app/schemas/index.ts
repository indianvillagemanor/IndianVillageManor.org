import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email(),
  password: z.string().min(1, { message: "Password is required" }),
})

export const RegisterSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email(),
  password: z.string().min(6, { message: "Password must be longer" }),
  name: z.string().min(1, { message: "Name is required" }),
  unit: z.string().min(2, { message: "Unit is required" }),
  phone: z.string().min(1, { message: "Phone number is required" })
})