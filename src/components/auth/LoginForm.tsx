"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { loginSchema, type LoginInput } from "@/features/auth/auth.schemas";
import api from "@/lib/axios";
import { setUser } from "@/utils/storage";
import { setAccessToken } from "@/lib/authToken";
import { Field, PrimaryButton } from "@/components/ui/kit";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const handleApiError = (error: unknown): string => {
    if (error instanceof AxiosError) {
      return (
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        `API Error: ${error.response?.status || "unknown"}`
      );
    }
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred";
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || `Login failed (${r.status})`);
      }
      const { access } = await r.json();
      setAccessToken(access);

      const me = await api.get("/auth/me/");
      setUser(me.data);

      router.push("/dashboard");
    } catch (error: unknown) {
      setError(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        placeholder="Your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      {error && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <PrimaryButton type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Signing in…" : "Sign in"}
      </PrimaryButton>

    </form>
  );
}
