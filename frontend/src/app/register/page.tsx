"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth, ApiError } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Card, CardBody } from "@/components/ui/Card";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await registerUser(values.name, values.email, values.password);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Unable to register. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="text-lg font-semibold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Start tracking your meetings with AI.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
            <FormField label="Name" htmlFor="name" error={errors.name?.message}>
              <Input id="name" autoComplete="name" {...register("name")} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters">
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            </FormField>

            {serverError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>}

            <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
              Register
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary">
              Log in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
