"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
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
import {
  registerSchema,
  type RegisterInput,
} from "@/features/auth/auth.schemas";
import api from "@/lib/axios";

// import googleAuthIcon from "@/components/icons/googleauth.png";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const handleApiError = (error: unknown): string => {
    if (error instanceof AxiosError) {
      return (
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        `Registration failed: ${error.response?.status || "unknown error"}`
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred";
  };

  const onSubmit = async (data: RegisterInput) => {
    console.log("🎯 REGISTER FORM SUBMITTED!");
    console.log("📝 Form data received:", data);
    console.log("🌐 API URL from env:", process.env.NEXT_PUBLIC_API_URL);

    // Transform data to match Django's expected field names
    const djangoData = {
      name: data.name,
      email: data.email,
      password1: data.password, // ✅ Correct: maps password to password1
      password2: data.password2, // ✅ Correct: uses password2
    };

    console.log("🔄 Transformed data for Django:", djangoData);

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      console.log(
        "🚀 About to make API call to:",
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register/`
      );

      // ✅ Fixed: Send djangoData instead of data
      const response = await api.post("/auth/register/", djangoData);

      console.log("✅ Registration API Response received:", response);
      console.log("📊 Response status:", response.status);
      console.log("📦 Response data:", response.data);

      setSuccess(true);
      console.log("✅ Registration successful, setting success state");

      console.log("⏰ Starting 2-second redirect timer...");
      setTimeout(() => {
        console.log("🚀 Redirecting to login page...");
        router.push("/auth/login");
      }, 2000);
    } catch (error: unknown) {
      console.error("❌ Registration form error occurred:", error);

      if (error instanceof AxiosError) {
        console.error("📄 Axios error details:");
        console.error("  - Status:", error.response?.status);
        console.error("  - Data:", error.response?.data);
        console.error("  - Headers:", error.response?.headers);
        console.error("  - Request URL:", error.config?.url);
        console.error("  - Request method:", error.config?.method);
      }

      setError(handleApiError(error));
    } finally {
      setIsLoading(false);
      console.log("🏁 Registration process completed");
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-green-600 text-4xl">✓</div>
            <h3 className="text-lg font-semibold">Registration Successful!</h3>
            <p className="text-sm text-muted-foreground">
              Redirecting you to login...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto relative overflow-hidden">
     
      <CardHeader className="space-y-1relative z-10">
        <CardTitle className="text-2xl font-bold text-center">
          Create Account
        </CardTitle>
        <CardDescription className="text-center">
          Enter your information to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              {...register("name")}
              id="username"
              type="text"
              placeholder="johndoe"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

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

          {/* ✅ Fixed: Uses 'password' to match schema */}
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

          {/* ✅ Fixed: Uses 'password2' and correct error reference */}
          <div className="space-y-2">
            <Label htmlFor="password2">Confirm Password</Label>
            <Input
              {...register("password2")}
              id="password2"
              type="password"
              placeholder="••••••••"
              className={errors.password2 ? "border-destructive" : ""}
            />
            {errors.password2 && (
              <p className="text-sm text-destructive">
                {errors.password2.message}
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
            {isLoading ? "Creating account..." : "Create Account"}
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

        {/* <div className="grid grid-cols-1 gap-4">
          <form action="/api/auth/signin/google" method="post">
            <Button type="submit" variant="outline" className="w-full">
              <img src={googleAuthIcon.src} alt="Google" className="mr-2 h-4 w-4" /> 
              Google
            </Button>
          </form>
           Example for GitHub when you add it 
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
