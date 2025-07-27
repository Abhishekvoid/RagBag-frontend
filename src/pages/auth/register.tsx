import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { GrainOverlay } from "@/components/ui/GrainOverlay"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
       <GrainOverlay intensity="strong" />
      <div className="w-full max-w-md space-y-6">
        <RegisterForm />
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/80 underline underline-offset-4"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
