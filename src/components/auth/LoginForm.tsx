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
import { setTokens } from "@/utils/storage";


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
  console.log('🎯 LOGIN FORM SUBMITTED!'); // Check if form submits
  console.log('📝 Form data received:', data);
  console.log('🌐 API URL from env:', process.env.NEXT_PUBLIC_API_URL);
  
  setIsLoading(true);   
  setError("");

  try {
    console.log('🚀 About to make API call to:', `${process.env.NEXT_PUBLIC_API_URL}/auth/jwt/create/`);
    
    const response = await api.post("/auth/jwt/create/", data);
    
    console.log('✅ API Response received:', response);
    console.log('📊 Response status:', response.status);
    console.log('📦 Response data:', response.data);

    // Store tokens in cookies
    const { access, refresh } = response.data;
    
    console.log('🔑 Tokens extracted:', {
      access: access ? 'Access token received' : 'No access token',
      refresh: refresh ? 'Refresh token received' : 'No refresh token'
    });
    
    setTokens(access, refresh);
    console.log('💾 Tokens stored in cookies');
    
    // Check if tokens were actually stored
    setTimeout(() => {
      console.log('🔍 Verifying stored tokens:');
      console.log('Access Token:', document.cookie.split(';').find(c => c.trim().startsWith('access_token=')));
      console.log('Refresh Token:', document.cookie.split(';').find(c => c.trim().startsWith('refresh_token=')));
    }, 100);

    // Redirect to dashboard
     router.push('/dashboard');
    
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
    console.log('🏁 Login process completed');
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
      </CardContent>
    </Card>
  );
}
