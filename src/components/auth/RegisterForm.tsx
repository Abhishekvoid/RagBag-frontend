"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

import { registerSchema, type RegisterInput } from "@/features/auth/auth.schemas";
import api from "@/lib/axios";
import { Field, PrimaryButton } from "@/components/ui/kit";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const handleApiError = (error: unknown): string => {
    if (error instanceof AxiosError) {
      return (
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        `Registration failed: ${error.response?.status || "unknown error"}`
      );
    }
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred";
  };

  const onSubmit = async (data: RegisterInput) => {
    const djangoData = {
      name: data.name,
      email: data.email,
      password1: data.password,
      password2: data.password2,
    };

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await api.post("/auth/register/", djangoData);
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 1800);
    } catch (error: unknown) {
      setError(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary olive-pulse">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold">You&apos;re in</h3>
        <p className="text-sm text-muted-foreground">Taking you to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field
        label="Name"
        type="text"
        placeholder="Priya Anand"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Field
        label="Email"
        type="email"
        placeholder="you@university.edu"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Field
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Field
        label="Confirm password"
        type="password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        error={errors.password2?.message}
        {...register("password2")}
      />

      {error && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <PrimaryButton type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating account…" : "Create account"}
      </PrimaryButton>

    </form>
  );
}
