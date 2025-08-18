"use client";

import React, { useState, useTransition } from 'react'

import * as z from "zod";

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";

import AuthCard from '@/components/auth/auth_card';
import { RegisterSchema } from '@/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { register } from './action';
import { FormError } from '@/components/form_error';
import { FormSuccess } from '@/components/form_success';


const RegisterPage = () => {
  const [isPending] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();


  // Prefill email from query string if present
  const [prefilled, setPrefilled] = useState(false);
  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      name: "",
      unit: "",
      phone: ""
    }
  });

  React.useEffect(() => {
    if (prefilled) return;
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email) {
      form.setValue("email", email);
      setPrefilled(true);
    }
  }, [form, prefilled]);


  const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    setError(undefined);
    setSuccess(undefined);

    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("unit", values.unit);
    formData.append("email", values.email);
    formData.append("phone", values.phone);
    const result = await register(formData);
    if (result && result.success) {
      window.location.href = "/auth/register/pending";
    } else {
      setError(result.error);
    }
  }

  // Show a message if the email is prefilled from the query string
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const prefilledEmail = params ? params.get("email") : null;

  return (
    <AuthCard
      cardLabel="Create an account!"
      exitLabel="Already have an account?"
      exitHref="/auth/login"
    >
      {prefilledEmail && (
        <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
          <b>Notice:</b> The email address <span className="font-mono">{prefilledEmail}</span> is not registered in our system.<br />
          Please register below, or check the spelling of your email address.
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field}
                      placeholder="John Doe"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit #</FormLabel>
                  <FormControl>
                    <Input {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field}
                      placeholder="john.doe@example.com"
                      type="email"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input {...field}
                      placeholder="313-555-1212"
                      type="phone"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button type="submit" className="w-full" disabled={isPending}>
            Register
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}

export default RegisterPage
