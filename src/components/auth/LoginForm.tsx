"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/features/auth/auth.schemas";
import api from "@/lib/axios";


// import googleAuthIcon from "@/components/icons/googleauth.png";
import { setUser } from "@/utils/storage";
import { setAccessToken } from "@/lib/authToken";


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

  const handleApiError = (error:unknown): string => {
    if (error instanceof AxiosError) {
      return (
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        `API Error: ${error.response?.status || 'unknown'}`
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected Error Occured";
  }
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
    console.error('❌ Login form error occurred:', error);

    if (error instanceof AxiosError) {
      console.error('📄 Axios error details:');
      console.error('  - Status:', error.response?.status);
      console.error('  - Data:', error.response?.data);
      console.error('  - Headers:', error.response?.headers);
      console.error('  - Request URL:', error.config?.url);
      console.error('  - Request method:', error.config?.method);
    }

    setError(handleApiError(error));
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Card className="relative overflow-hidden w-full max-w-md mx-auto">
      
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Welcome back
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="you@example.com"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              {...register("password")}
              id="password"
              type="password"
              placeholder="••••••••"
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          {/* <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div> */}
        </div>

        {/*} <div className="grid grid-cols-2 gap-4">
          <form action="/api/auth/signin/google" method="post">
            <Button type="submit" variant="outline" className="w-full">
               <img src={googleAuthIcon.src} alt="Google" className="mr-2 h-4 w-4" /> 
              Google
            </Button>
          </form>
          <form action="/api/auth/signin/github" method="post">
            <Button type="submit" variant="outline" className="w-full">
              <Icons.gitHub className="mr-2 h-4 w-4" />
              GitHub
            </Button> 
          </form> 
        </div> */}
      </CardContent>
    </Card>
  );
}
