import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { GrainOverlay } from "@/components/ui/GrainOverlay"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      
        <GrainOverlay intensity="strong" />
     
      
      <div className="w-full max-w-md space-y-6n relative z-10">
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary hover:text-primary/80 underline underline-offset-4"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}