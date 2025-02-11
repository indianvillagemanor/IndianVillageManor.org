"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';

import AuthCard from '@/components/auth/auth_card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";


const LoginPage = () => {

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  return (
    <AuthCard cardLabel={'Co-owner and Resident portal to IVM'} exitLabel={"Register as a new user"} exitHref={'/auth/register'}>
      <Form {...form}>
        <form
          onSubmit={() => { }}
          className="space-y-6">
          <div className="space-y-4">
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
                      disabled={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field}
                      placeholder="******"
                      type="password"
                      disabled={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* <FormError message={error} />
          <FormSuccess message={success} /> */}
          <Button type="submit" className="w-full" disabled={false}>
            Login
          </Button>
        </form>
      </Form>
    </AuthCard >
  )
}

export default LoginPage
